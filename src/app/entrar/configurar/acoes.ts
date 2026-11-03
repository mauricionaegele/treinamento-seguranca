"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { lerSessao } from "@/lib/sessao";
import { decifrar, hash, hashSenha, normalizaCodigoEmergencia, novosCodigosEmergencia, origemRequisicao } from "@/lib/seguranca";
import { confereTotp } from "@/lib/totp";

export type EstadoConfig = { erro?: string; codigos?: string[] };

async function adminPendente() {
  const s = await lerSessao();
  if (!s?.adminPendente) redirect("/entrar");
  return { sessaoId: s.id, admin: s.adminPendente };
}

async function gravaCodigos(adminId: string) {
  const codigos = novosCodigosEmergencia();
  await prisma.usuarioAdmin.update({
    where: { id: adminId },
    data: { codigosEmergencia: codigos.map((c) => hash(`emergencia:${normalizaCodigoEmergencia(c)}`)) },
  });
  return codigos;
}

export async function configurarAcesso(_: EstadoConfig, form: FormData): Promise<EstadoConfig> {
  const { admin } = await adminPendente();
  if (admin.totpAtivo) return { erro: "O autenticador já foi configurado." };
  if (!admin.totpSegredo) return { erro: "Recarregue a página e tente de novo." };

  const senha = String(form.get("senha") ?? "");
  const confirma = String(form.get("confirma") ?? "");
  const codigo = String(form.get("codigo") ?? "").replace(/\D/g, "");
  if (senha.length < 10) return { erro: "A senha precisa ter pelo menos 10 caracteres." };
  if (senha !== confirma) return { erro: "As duas senhas não são iguais." };
  if (senha.toLowerCase().includes(admin.email.split("@")[0].toLowerCase())) return { erro: "A senha não pode conter o seu e-mail." };
  if (codigo.length !== 6) return { erro: "Digite o código de 6 números que aparece no aplicativo." };

  const passo = confereTotp(decifrar(admin.totpSegredo), codigo, null);
  if (passo === null) return { erro: "Código incorreto. Confira se o relógio do celular está certo e use o código que está aparecendo agora." };

  await prisma.usuarioAdmin.update({
    where: { id: admin.id },
    data: { senhaHash: hashSenha(senha), totpAtivo: true, totpUltimoPasso: passo, mfaConfiguradoEm: new Date() },
  });
  const codigos = await gravaCodigos(admin.id);
  const { ip, userAgent } = await origemRequisicao();
  await prisma.registroAcesso.create({ data: { email: admin.email, evento: "mfa_configurado", ip, userAgent } });
  return { codigos };
}

/** Se a página foi recarregada antes de anotar os códigos, gera outros. */
export async function gerarNovosCodigos(): Promise<EstadoConfig> {
  const { admin } = await adminPendente();
  if (!admin.totpAtivo) return { erro: "Configure o autenticador primeiro." };
  return { codigos: await gravaCodigos(admin.id) };
}

export async function concluirConfiguracao() {
  const { sessaoId, admin } = await adminPendente();
  if (!admin.totpAtivo) redirect("/entrar/configurar");
  await prisma.sessao.update({ where: { id: sessaoId }, data: { adminPendente: false } });
  redirect("/admin");
}
