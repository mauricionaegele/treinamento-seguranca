import "server-only";
import { prisma } from "./prisma";
import { MODULOS, NOTA_MODULO } from "./modulos";
import { codigoCertificado } from "./seguranca";

export function calculaValidade(emitidoEm: Date, meses: number) {
  const d = new Date(emitidoEm);
  d.setMonth(d.getMonth() + meses);
  return d;
}

/**
 * Para clientes sem prova final: emite o certificado quando todos os
 * módulos estão concluídos. A nota é a média das melhores notas dos quizzes.
 */
export async function emitirSemProvaSeCompleto(colaboradorId: string) {
  const colab = await prisma.colaborador.findUniqueOrThrow({ where: { id: colaboradorId }, include: { cliente: true } });
  const cliente = colab.cliente;
  if (cliente.exigeProvaFinal) return null;
  const ciclo = cliente.cicloAtual;
  const existente = await prisma.certificado.findUnique({ where: { colaboradorId_ciclo: { colaboradorId, ciclo } } });
  if (existente) return existente;

  const progresso = await prisma.progressoModulo.findMany({ where: { colaboradorId, ciclo } });
  const notas = MODULOS.map((m) => progresso.find((p) => p.modulo === m.id)?.melhorNota ?? 0);
  if (notas.some((n) => n < NOTA_MODULO)) return null;

  const nota = Math.round(notas.reduce((a, b) => a + b, 0) / notas.length);
  const agora = new Date();
  const cert = await prisma.certificado.create({
    data: { codigo: codigoCertificado(), colaboradorId, ciclo, nota, emitidoEm: agora, validoAte: calculaValidade(agora, cliente.validadeMeses) },
  });
  await prisma.registroAcesso.create({
    data: { colaboradorId, email: colab.email, evento: "certificado_emitido", detalhe: `sem_prova:nota:${nota}` },
  });
  return cert;
}
