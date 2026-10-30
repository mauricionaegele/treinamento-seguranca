"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { questaoPorId, sortearProva } from "@/lib/questoes";
import { codigoCertificado, origemRequisicao } from "@/lib/seguranca";
import { exigirColaborador } from "@/lib/sessao";
import { situacaoProva } from "@/lib/prova";
import { calculaValidade } from "@/lib/certificado";

type QuestaoSorteada = { id: string; ordem: number[] };

export async function iniciarProva() {
  const { colaborador } = await exigirColaborador();
  if (!colaborador.cliente.exigeProvaFinal) redirect("/");
  const s = await situacaoProva(colaborador.id, colaborador.cliente);
  if (!s.modulosOk || s.certificado || s.aberta || s.restam <= 0) redirect("/prova");

  const { ip, userAgent } = await origemRequisicao();
  await prisma.tentativaProva.create({
    data: { colaboradorId: colaborador.id, ciclo: colaborador.cliente.cicloAtual, questoes: sortearProva(), ip },
  });
  await prisma.registroAcesso.create({
    data: { colaboradorId: colaborador.id, email: colaborador.email, evento: "prova_iniciada", ip, userAgent },
  });
  redirect("/prova");
}

export async function enviarProva(form: FormData) {
  const { colaborador } = await exigirColaborador();
  const cliente = colaborador.cliente;
  const s = await situacaoProva(colaborador.id, cliente);
  if (!s.aberta) redirect("/prova");

  const sorteadas = s.aberta.questoes as QuestaoSorteada[];
  const respostas: Record<string, number> = {};
  let acertos = 0;
  for (const qs of sorteadas) {
    const q = questaoPorId(qs.id);
    const mostrada = Number(form.get(`q_${qs.id}`));
    if (!q || !Number.isInteger(mostrada) || mostrada < 0 || mostrada >= qs.ordem.length) {
      redirect("/prova?erro=incompleta");
    }
    const original = qs.ordem[mostrada]; // posição mostrada -> opção original
    respostas[qs.id] = original;
    if (original === q.c) acertos++;
  }
  const nota = Math.round((acertos / sorteadas.length) * 100);
  const aprovado = nota >= cliente.notaMinima;
  const agora = new Date();
  const { ip, userAgent } = await origemRequisicao();

  await prisma.$transaction(async (tx) => {
    await tx.tentativaProva.update({ where: { id: s.aberta!.id }, data: { respostas, nota, aprovado, finalizadaEm: agora } });
    if (aprovado) {
      const validoAte = calculaValidade(agora, cliente.validadeMeses);
      await tx.certificado.create({
        data: { codigo: codigoCertificado(), colaboradorId: colaborador.id, ciclo: cliente.cicloAtual, tentativaId: s.aberta!.id, nota, emitidoEm: agora, validoAte },
      });
    }
    await tx.registroAcesso.create({
      data: { colaboradorId: colaborador.id, email: colaborador.email, evento: "prova_finalizada", detalhe: `nota:${nota}`, ip, userAgent },
    });
  });
  redirect(`/prova?resultado=${s.aberta.id}`);
}
