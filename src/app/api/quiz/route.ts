import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { lerSessao } from "@/lib/sessao";
import { IDS_MODULOS, NOTA_MODULO, type IdModulo } from "@/lib/modulos";
import { QUIZZES } from "@/lib/quizzes";
import { emitirSemProvaSeCompleto } from "@/lib/certificado";

// Quiz dos módulos, conferido no servidor.
//   { acao: "iniciar", modulo }                       -> { tentativa, perguntas: [{ q, o }] }
//   { acao: "responder", tentativa, indice, opcao }   -> { correta, certa, explicacao, fim, nota? }
const Corpo = z.discriminatedUnion("acao", [
  z.object({ acao: z.literal("iniciar"), modulo: z.string().refine((m) => IDS_MODULOS.includes(m)) }),
  z.object({ acao: z.literal("responder"), tentativa: z.string(), indice: z.number().int().min(0), opcao: z.number().int().min(0) }),
]);

export async function POST(req: NextRequest) {
  const origem = req.headers.get("origin");
  if (origem && new URL(origem).host !== req.headers.get("host")) {
    return NextResponse.json({ erro: "origem inválida" }, { status: 403 });
  }
  const sessao = await lerSessao();
  if (!sessao?.colaborador) return NextResponse.json({ erro: "não autenticado" }, { status: 401 });
  const colab = sessao.colaborador;
  const ciclo = colab.cliente.cicloAtual;

  const dados = Corpo.safeParse(await req.json().catch(() => null));
  if (!dados.success) return NextResponse.json({ erro: "dados inválidos" }, { status: 400 });
  const d = dados.data;

  if (d.acao === "iniciar") {
    const modulo = d.modulo as IdModulo;
    const t = await prisma.quizTentativa.create({ data: { colaboradorId: colab.id, ciclo, modulo } });
    return NextResponse.json({ tentativa: t.id, perguntas: QUIZZES[modulo].map((p) => ({ q: p.q, o: p.o })) });
  }

  // --- responder
  const t = await prisma.quizTentativa.findFirst({ where: { id: d.tentativa, colaboradorId: colab.id, finalizadaEm: null } });
  if (!t) return NextResponse.json({ erro: "tentativa encerrada" }, { status: 409 });
  const perguntas = QUIZZES[t.modulo as IdModulo];
  const p = perguntas[d.indice];
  if (!p || d.opcao >= p.o.length) return NextResponse.json({ erro: "pergunta inválida" }, { status: 400 });

  const respostas = { ...(t.respostas as Record<string, number>) };
  if (respostas[d.indice] === undefined) respostas[d.indice] = d.opcao; // vale a primeira resposta
  const escolhida = respostas[d.indice];
  const fim = Object.keys(respostas).length === perguntas.length;

  let nota: number | undefined;
  if (fim) {
    const acertos = perguntas.filter((q, i) => respostas[i] === q.c).length;
    nota = Math.round((acertos / perguntas.length) * 100);
  }
  await prisma.quizTentativa.update({ where: { id: t.id }, data: { respostas, ...(fim ? { nota, finalizadaEm: new Date() } : {}) } });

  if (fim && nota !== undefined) await registrarNota(colab.id, colab.email, ciclo, t.modulo, nota, !colab.cliente.exigeProvaFinal);

  return NextResponse.json({ correta: escolhida === p.c, escolhida, certa: p.c, explicacao: p.e, fim, nota });
}

async function registrarNota(colaboradorId: string, email: string, ciclo: number, modulo: string, nota: number, semProva: boolean) {
  const chave = { colaboradorId_ciclo_modulo: { colaboradorId, ciclo, modulo } };
  const atual = await prisma.progressoModulo.findUnique({ where: chave });
  const aprovadoAgora = nota >= NOTA_MODULO && !atual?.concluidoEm;
  await prisma.progressoModulo.upsert({
    where: chave,
    create: { colaboradorId, ciclo, modulo, melhorNota: nota, tentativas: 1, concluidoEm: nota >= NOTA_MODULO ? new Date() : null },
    update: { melhorNota: Math.max(nota, atual?.melhorNota ?? 0), tentativas: { increment: 1 }, ...(aprovadoAgora ? { concluidoEm: new Date() } : {}) },
  });
  if (aprovadoAgora) {
    await prisma.registroAcesso.create({ data: { colaboradorId, email, evento: "modulo_concluido", detalhe: `${modulo}:${nota}` } });
  }
  if (semProva && nota >= NOTA_MODULO) await emitirSemProvaSeCompleto(colaboradorId);
}
