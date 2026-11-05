"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirAdmin, podeVerCliente } from "@/lib/sessao";
import { normalizaEmail } from "@/lib/seguranca";
import { lerPlanilha, lerTextoColado } from "@/lib/importacao";
import { enviarConvite, enviarLembrete } from "@/lib/email";
import { situacaoDoCliente } from "@/lib/status";
import { MODULOS } from "@/lib/modulos";

async function exigirBroadcast() {
  const s = await exigirAdmin();
  if (s.admin.papel !== "ADMIN") redirect("/admin");
  return s;
}

function texto(form: FormData, campo: string) {
  return String(form.get(campo) ?? "").trim();
}

const DadosCliente = z.object({
  nome: z.string().min(2, "Informe o nome do cliente"),
  contatoTi: z.string().max(300),
  cicloAtual: z.coerce.number().int().min(2020).max(2100),
  prazo: z.string(),
  notaMinima: z.coerce.number().int().min(0).max(100),
  maxTentativas: z.coerce.number().int().min(1).max(20),
  validadeMeses: z.coerce.number().int().min(1).max(60),
});

export async function salvarCliente(form: FormData) {
  await exigirBroadcast();
  const id = texto(form, "id");
  const d = DadosCliente.safeParse(Object.fromEntries(form));
  if (!d.success) redirect(`${id ? `/admin/clientes/${id}/editar` : "/admin/clientes/novo"}?erro=${encodeURIComponent(d.error.issues[0].message)}`);
  const dados = {
    nome: d.data.nome,
    contatoTi: d.data.contatoTi,
    cicloAtual: d.data.cicloAtual,
    prazo: d.data.prazo ? new Date(`${d.data.prazo}T12:00:00Z`) : null,
    notaMinima: d.data.notaMinima,
    maxTentativas: d.data.maxTentativas,
    validadeMeses: d.data.validadeMeses,
    exigeProvaFinal: form.get("exigeProvaFinal") === "on",
    gestorMfa: form.get("gestorMfa") === "on",
  };
  const cliente = id
    ? await prisma.cliente.update({ where: { id }, data: dados })
    : await prisma.cliente.create({ data: dados });
  redirect(`/admin/clientes/${cliente.id}?msg=${encodeURIComponent("Dados do cliente salvos.")}`);
}

export async function importarColaboradores(form: FormData) {
  await exigirBroadcast();
  const clienteId = texto(form, "clienteId");
  const arquivo = form.get("arquivo");
  const colado = texto(form, "colado");

  let resultado: Awaited<ReturnType<typeof lerPlanilha>>;
  if (arquivo instanceof File && arquivo.size > 0) {
    if (arquivo.size > 5 * 1024 * 1024) redirect(`/admin/clientes/${clienteId}/importar?erro=${encodeURIComponent("Arquivo maior que 5 MB.")}`);
    resultado = await lerPlanilha(arquivo.name, await arquivo.arrayBuffer());
  } else if (colado) {
    resultado = lerTextoColado(colado);
  } else {
    redirect(`/admin/clientes/${clienteId}/importar?erro=${encodeURIComponent("Escolha um arquivo ou cole a lista.")}`);
  }

  let novos = 0, atualizados = 0;
  const conflitos: string[] = [];
  for (const r of resultado.registros) {
    const existente = await prisma.colaborador.findUnique({ where: { email: r.email } });
    if (existente && existente.clienteId !== clienteId) {
      conflitos.push(`${r.email} já está cadastrado em outro cliente.`);
      continue;
    }
    if (existente) {
      await prisma.colaborador.update({ where: { id: existente.id }, data: { nome: r.nome, setor: r.setor, gerente: r.gerente, ativo: true } });
      atualizados++;
    } else {
      await prisma.colaborador.create({ data: { clienteId, ...r } });
      novos++;
    }
  }
  const avisos = [...resultado.erros, ...conflitos];
  const msg = `${novos} colaborador(es) novo(s), ${atualizados} atualizado(s).` + (avisos.length ? ` ${avisos.length} linha(s) ignorada(s).` : "");
  const qs = new URLSearchParams({ msg });
  if (avisos.length) qs.set("avisos", avisos.slice(0, 20).join("\n"));
  redirect(`/admin/clientes/${clienteId}/importar?${qs}`);
}

export async function adicionarColaborador(form: FormData) {
  await exigirBroadcast();
  const clienteId = texto(form, "clienteId");
  const email = normalizaEmail(texto(form, "email"));
  const nome = texto(form, "nome");
  if (!nome || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect(`/admin/clientes/${clienteId}/importar?erro=${encodeURIComponent("Informe nome e e-mail válidos.")}`);
  const existente = await prisma.colaborador.findUnique({ where: { email } });
  if (existente && existente.clienteId !== clienteId) redirect(`/admin/clientes/${clienteId}/importar?erro=${encodeURIComponent("Este e-mail já está em outro cliente.")}`);
  await prisma.colaborador.upsert({
    where: { email },
    create: { clienteId, nome, email, setor: texto(form, "setor"), gerente: texto(form, "gerente") },
    update: { nome, setor: texto(form, "setor"), gerente: texto(form, "gerente"), ativo: true },
  });
  redirect(`/admin/clientes/${clienteId}/importar?msg=${encodeURIComponent(`${nome} adicionado(a).`)}`);
}

export async function desativarColaborador(form: FormData) {
  await exigirBroadcast();
  const id = texto(form, "id");
  const c = await prisma.colaborador.update({ where: { id }, data: { ativo: false } });
  await prisma.sessao.deleteMany({ where: { colaboradorId: id } });
  revalidatePath(`/admin/clientes/${c.clienteId}`);
}

/** Libera mais uma tentativa da prova apagando a última tentativa reprovada. */
export async function liberarTentativa(form: FormData) {
  const { admin } = await exigirAdmin();
  const id = texto(form, "id");
  const c = await prisma.colaborador.findUniqueOrThrow({ where: { id }, include: { cliente: true } });
  if (!podeVerCliente(admin, c.clienteId) || admin.papel !== "ADMIN") redirect("/admin");
  const ultima = await prisma.tentativaProva.findFirst({
    where: { colaboradorId: id, ciclo: c.cliente.cicloAtual, aprovado: false },
    orderBy: { finalizadaEm: "desc" },
  });
  if (ultima) {
    await prisma.tentativaProva.delete({ where: { id: ultima.id } });
    await prisma.registroAcesso.create({ data: { colaboradorId: id, email: c.email, evento: "tentativa_liberada", detalhe: `por:${admin.email}` } });
  }
  revalidatePath(`/admin/clientes/${c.clienteId}`);
}

/**
 * Envia e-mail para os colaboradores escolhidos (modo "selecionados") ou para
 * todos os pendentes. Quem não começou recebe o convite; quem parou no meio,
 * o lembrete; quem já concluiu é ignorado.
 */
export async function enviarEmails(form: FormData) {
  const { admin } = await exigirAdmin();
  const clienteId = texto(form, "clienteId");
  if (!podeVerCliente(admin, clienteId)) redirect("/admin");
  const modo = texto(form, "modo");
  const ids = new Set(form.getAll("ids").map(String));
  if (modo === "selecionados" && ids.size === 0) {
    redirect(`/admin/clientes/${clienteId}?erro=${encodeURIComponent("Marque pelo menos um colaborador.")}`);
  }

  const { cliente, linhas } = await situacaoDoCliente(clienteId);
  const alvo = linhas.filter((l) => (modo === "selecionados" ? ids.has(l.id) : true));
  const minutos = MODULOS.reduce((t, m) => t + m.minutos, 0);
  let convites = 0, lembretes = 0, falhas = 0, concluidos = 0;
  for (const l of alvo) {
    if (l.situacao === "concluido") { concluidos++; continue; }
    const tipo = l.situacao === "nao_iniciado" ? "convite" : "lembrete";
    try {
      if (tipo === "convite") await enviarConvite(l.email, l.nome, cliente.nome, cliente.prazo, minutos);
      else await enviarLembrete(l.email, l.nome, cliente.prazo, l.modulosConcluidos, MODULOS.length);
      await prisma.lembrete.create({ data: { colaboradorId: l.id, tipo, enviadoPor: admin.email } });
      if (tipo === "convite") convites++; else lembretes++;
    } catch (e) {
      falhas++;
      console.error("Falha ao enviar e-mail para", l.email, e);
    }
  }

  const partes = [];
  if (convites) partes.push(`${convites} convite(s)`);
  if (lembretes) partes.push(`${lembretes} lembrete(s)`);
  let msg = partes.length ? `Enviado: ${partes.join(" e ")}.` : "Nenhum e-mail enviado.";
  if (concluidos) msg += ` ${concluidos} já concluído(s), não receberam.`;
  if (falhas) msg += ` ${falhas} falha(s) no envio.`;
  redirect(`/admin/clientes/${clienteId}?${falhas ? "erro" : "msg"}=${encodeURIComponent(msg)}`);
}

export async function iniciarNovoCiclo(form: FormData) {
  await exigirBroadcast();
  const clienteId = texto(form, "clienteId");
  const confirmacao = texto(form, "confirmacao");
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id: clienteId } });
  const novo = cliente.cicloAtual + 1;
  if (confirmacao !== String(novo)) {
    redirect(`/admin/clientes/${clienteId}/editar?erro=${encodeURIComponent(`Para confirmar, digite ${novo}.`)}`);
  }
  await prisma.cliente.update({ where: { id: clienteId }, data: { cicloAtual: novo, prazo: null } });
  redirect(`/admin/clientes/${clienteId}?msg=${encodeURIComponent(`Ciclo ${novo} iniciado. O histórico de ${cliente.cicloAtual} continua guardado.`)}`);
}

export async function salvarUsuario(form: FormData) {
  await exigirBroadcast();
  const email = normalizaEmail(texto(form, "email"));
  const nome = texto(form, "nome");
  const papel = texto(form, "papel") === "GERENTE" ? "GERENTE" : "ADMIN";
  const clienteId = papel === "GERENTE" ? texto(form, "clienteId") || null : null;
  if (!nome || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect(`/admin/usuarios?erro=${encodeURIComponent("Informe nome e e-mail válidos.")}`);
  if (papel === "GERENTE" && !clienteId) redirect(`/admin/usuarios?erro=${encodeURIComponent("Escolha o cliente do gestor.")}`);
  await prisma.usuarioAdmin.upsert({
    where: { email },
    create: { nome, email, papel, clienteId },
    update: { nome, papel, clienteId, ativo: true },
  });
  redirect(`/admin/usuarios?msg=${encodeURIComponent(`${nome} pode acessar a área administrativa.`)}`);
}

export async function desativarUsuario(form: FormData) {
  const { admin } = await exigirBroadcast();
  const id = texto(form, "id");
  if (id === admin.id) redirect(`/admin/usuarios?erro=${encodeURIComponent("Você não pode desativar o próprio acesso.")}`);
  await prisma.usuarioAdmin.update({ where: { id }, data: { ativo: false } });
  await prisma.sessao.deleteMany({ where: { adminId: id } });
  revalidatePath("/admin/usuarios");
}

/** Esqueceu a senha ou perdeu o celular: apaga senha e autenticador. No próximo
 *  acesso a pessoa entra pelo código do e-mail e configura tudo de novo. */
export async function zerarAcesso(form: FormData) {
  const { admin } = await exigirBroadcast();
  const id = texto(form, "id");
  if (id === admin.id) redirect(`/admin/usuarios?erro=${encodeURIComponent("Peça a outro administrador para zerar o seu acesso.")}`);
  const u = await prisma.usuarioAdmin.update({
    where: { id },
    data: { senhaHash: null, totpSegredo: null, totpAtivo: false, totpUltimoPasso: null, codigosEmergencia: Prisma.DbNull, mfaConfiguradoEm: null },
  });
  await prisma.sessao.deleteMany({ where: { adminId: id } });
  await prisma.registroAcesso.create({ data: { email: u.email, evento: "mfa_zerado", detalhe: `por:${admin.email}` } });
  redirect(`/admin/usuarios?msg=${encodeURIComponent(`Acesso de ${u.nome} zerado. No próximo login, ${u.nome.split(" ")[0]} recebe o código por e-mail e cadastra senha e autenticador de novo.`)}`);
}
