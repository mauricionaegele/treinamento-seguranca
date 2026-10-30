import "server-only";
import { prisma } from "./prisma";
import { MODULOS, NOTA_MODULO } from "./modulos";

/** Confere se o colaborador pode fazer a prova agora. */
export async function situacaoProva(colaboradorId: string, cliente: { cicloAtual: number; maxTentativas: number }) {
  const ciclo = cliente.cicloAtual;
  const [progresso, certificado, finalizadas, aberta] = await Promise.all([
    prisma.progressoModulo.findMany({ where: { colaboradorId, ciclo } }),
    prisma.certificado.findUnique({ where: { colaboradorId_ciclo: { colaboradorId, ciclo } } }),
    prisma.tentativaProva.count({ where: { colaboradorId, ciclo, finalizadaEm: { not: null } } }),
    prisma.tentativaProva.findFirst({ where: { colaboradorId, ciclo, finalizadaEm: null }, orderBy: { iniciadaEm: "desc" } }),
  ]);
  const modulosOk = MODULOS.every((m) => (progresso.find((p) => p.modulo === m.id)?.melhorNota ?? 0) >= NOTA_MODULO);
  return { modulosOk, certificado, finalizadas, aberta, restam: cliente.maxTentativas - finalizadas };
}

