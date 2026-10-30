import "server-only";
import { prisma } from "./prisma";
import { MODULOS, NOTA_MODULO } from "./modulos";

export type Situacao = "concluido" | "andamento" | "nao_iniciado";
export const ROTULO_SITUACAO: Record<Situacao, string> = {
  concluido: "Concluído",
  andamento: "Em andamento",
  nao_iniciado: "Não iniciado",
};

/** Situação de cada colaborador ativo de um cliente no ciclo atual. */
export async function situacaoDoCliente(clienteId: string) {
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id: clienteId } });
  const ciclo = cliente.cicloAtual;
  const colaboradores = await prisma.colaborador.findMany({
    where: { clienteId, ativo: true },
    orderBy: { nome: "asc" },
    include: {
      progresso: { where: { ciclo } },
      tentativas: { where: { ciclo, finalizadaEm: { not: null } }, orderBy: { finalizadaEm: "asc" } },
      certificados: { where: { ciclo } },
      acessos: { where: { evento: "login" }, orderBy: { criadoEm: "desc" }, take: 1 },
      lembretes: { orderBy: { enviadoEm: "desc" }, take: 1 },
    },
  });

  const linhas = colaboradores.map((c) => {
    const modulos = MODULOS.map((m) => {
      const p = c.progresso.find((x) => x.modulo === m.id);
      return {
        id: m.id,
        titulo: m.titulo,
        iniciado: !!p,
        concluido: !!p && (p.melhorNota ?? 0) >= NOTA_MODULO,
        nota: p?.melhorNota ?? null,
        concluidoEm: p?.concluidoEm ?? null,
      };
    });
    const cert = c.certificados[0] ?? null;
    const melhor = c.tentativas.reduce<number | null>((m, t) => (t.nota !== null && (m === null || t.nota > m) ? t.nota : m), null);
    const situacao: Situacao = cert ? "concluido" : c.progresso.length || c.tentativas.length ? "andamento" : "nao_iniciado";
    return {
      id: c.id,
      nome: c.nome,
      email: c.email,
      setor: c.setor,
      gerente: c.gerente,
      modulos,
      modulosConcluidos: modulos.filter((m) => m.concluido).length,
      tentativasProva: c.tentativas.length,
      melhorNotaProva: melhor,
      certificado: cert,
      situacao,
      ultimoAcesso: c.acessos[0]?.criadoEm ?? null,
      ultimoLembrete: c.lembretes[0]?.enviadoEm ?? null,
    };
  });

  const total = linhas.length;
  const conta = (s: Situacao) => linhas.filter((l) => l.situacao === s).length;
  const notas = linhas.map((l) => l.certificado?.nota).filter((n): n is number => typeof n === "number");
  const agora = Date.now();
  const resumo = {
    total,
    concluido: conta("concluido"),
    andamento: conta("andamento"),
    naoIniciado: conta("nao_iniciado"),
    pct: total ? Math.round((conta("concluido") / total) * 100) : 0,
    media: notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : null,
    vencendo: linhas.filter((l) => l.certificado && l.certificado.validoAte.getTime() - agora < 30 * 86400_000).length,
  };
  return { cliente, linhas, resumo };
}

export function formataData(d: Date | null | undefined, comHora = false) {
  if (!d) return "—";
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit", year: "numeric",
    ...(comHora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
