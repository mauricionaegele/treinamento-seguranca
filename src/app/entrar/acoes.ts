"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { enviarCodigo } from "@/lib/email";
import {
  codigoSeisDigitos, confereSenha, decifrar, hash, iguais, normalizaCodigoEmergencia, normalizaEmail, origemRequisicao,
} from "@/lib/seguranca";
import { confereTotp } from "@/lib/totp";
import { criarSessao, exigeMfa } from "@/lib/sessao";

const COOKIE_EMAIL = "login_email";
const VALIDADE_MIN = 10;
const MAX_CODIGOS_HORA = 5;
const MAX_TENTATIVAS = 5;
const MAX_FALHAS_SENHA = 5; // em 15 minutos

export type EstadoLogin = { erro?: string; aviso?: string };

async function contaDoEmail(email: string) {
  const [colaborador, admin] = await Promise.all([
    prisma.colaborador.findUnique({ where: { email }, include: { cliente: true } }),
    prisma.usuarioAdmin.findUnique({ where: { email }, include: { cliente: true } }),
  ]);
  return {
    colaborador: colaborador?.ativo && colaborador.cliente.ativo ? colaborador : null,
    admin: admin?.ativo ? admin : null,
  };
}

async function guardaEmail(email: string) {
  const c = await cookies();
  c.set(COOKIE_EMAIL, email, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 900, path: "/" });
}

export async function solicitarCodigo(_: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const email = normalizaEmail(String(form.get("email") ?? ""));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { erro: "Digite um e-mail válido." };

  const conta = await contaDoEmail(email);

  // Administrador com autenticador configurado: entra com senha + código do app,
  // nunca pelo código do e-mail.
  if (conta.admin && exigeMfa(conta.admin) && conta.admin.totpAtivo) {
    await guardaEmail(email);
    redirect("/entrar?etapa=senha");
  }

  const { ip } = await origemRequisicao();
  const umaHora = new Date(Date.now() - 3600_000);
  const recentes = await prisma.codigoAcesso.count({ where: { email, criadoEm: { gte: umaHora } } });
  if (recentes >= MAX_CODIGOS_HORA) {
    return { erro: "Muitos códigos pedidos para este e-mail. Aguarde alguns minutos e tente de novo." };
  }

  // Só gera e envia código para quem está cadastrado. A tela é a mesma nos
  // dois casos, para não revelar quais e-mails existem no sistema.
  if (conta.colaborador || conta.admin) {
    const codigo = codigoSeisDigitos();
    await prisma.codigoAcesso.create({
      data: { email, codigoHash: hash(codigo), expiraEm: new Date(Date.now() + VALIDADE_MIN * 60_000), ip },
    });
    await enviarCodigo(email, codigo);
  }

  await guardaEmail(email);
  redirect("/entrar?etapa=codigo");
}

export async function verificarCodigo(_: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const c = await cookies();
  const email = c.get(COOKIE_EMAIL)?.value;
  if (!email) return { erro: "Sua sessão de login expirou. Volte e digite seu e-mail de novo." };
  const digitado = String(form.get("codigo") ?? "").replace(/\D/g, "");
  if (digitado.length !== 6) return { erro: "O código tem 6 números." };

  const registro = await prisma.codigoAcesso.findFirst({
    where: { email, usadoEm: null, expiraEm: { gt: new Date() } },
    orderBy: { criadoEm: "desc" },
  });
  if (!registro) return { erro: "Código inválido ou expirado. Peça um novo código." };
  if (registro.tentativas >= MAX_TENTATIVAS) return { erro: "Muitas tentativas erradas. Peça um novo código." };

  if (!iguais(registro.codigoHash, hash(digitado))) {
    await prisma.codigoAcesso.update({ where: { id: registro.id }, data: { tentativas: { increment: 1 } } });
    const restam = MAX_TENTATIVAS - registro.tentativas - 1;
    return { erro: restam > 0 ? `Código incorreto. Você ainda tem ${restam} tentativa(s).` : "Código incorreto. Peça um novo código." };
  }

  await prisma.codigoAcesso.update({ where: { id: registro.id }, data: { usadoEm: new Date() } });
  const conta = await contaDoEmail(email);
  if (!conta.colaborador && !conta.admin) return { erro: "Acesso não autorizado." };

  // admin que precisa de login forte: o código do e-mail só serve para o
  // primeiro acesso, em que ele cria a senha e cadastra o autenticador
  const admin = conta.admin;
  const precisaMfa = !!admin && exigeMfa(admin);
  if (precisaMfa && admin.totpAtivo) return { erro: "Use sua senha e o código do Google Authenticator." };

  const { ip, userAgent } = await origemRequisicao();
  await criarSessao({ colaboradorId: conta.colaborador?.id, adminId: admin?.id, adminPendente: precisaMfa, ip, userAgent });
  await prisma.registroAcesso.create({
    data: { colaboradorId: conta.colaborador?.id ?? null, email, evento: "login", detalhe: admin ? `admin:${admin.papel}${precisaMfa ? ":primeiro-acesso" : ""}` : "", ip, userAgent },
  });
  c.delete(COOKIE_EMAIL);
  redirect(precisaMfa ? "/entrar/configurar" : conta.colaborador ? "/" : "/admin");
}

export async function verificarSenha(_: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const c = await cookies();
  const email = c.get(COOKIE_EMAIL)?.value;
  if (!email) return { erro: "Sua sessão de login expirou. Volte e digite seu e-mail de novo." };
  const senha = String(form.get("senha") ?? "");
  const codigo = String(form.get("codigo") ?? "").trim();
  if (!senha || !codigo) return { erro: "Preencha a senha e o código." };

  const { ip, userAgent } = await origemRequisicao();
  const quinzeMin = new Date(Date.now() - 15 * 60_000);
  const falhas = await prisma.registroAcesso.count({ where: { email, evento: "login_falha", criadoEm: { gte: quinzeMin } } });
  if (falhas >= MAX_FALHAS_SENHA) return { erro: "Muitas tentativas erradas. Aguarde 15 minutos e tente de novo." };

  const conta = await contaDoEmail(email);
  const admin = conta.admin;
  const falhou = async () => {
    await prisma.registroAcesso.create({ data: { email, evento: "login_falha", ip, userAgent } });
    const restam = MAX_FALHAS_SENHA - falhas - 1;
    return { erro: restam > 0 ? `Senha ou código incorreto. Você ainda tem ${restam} tentativa(s).` : "Senha ou código incorreto. Aguarde 15 minutos e tente de novo." };
  };
  if (!admin || !admin.totpAtivo || !admin.totpSegredo || !confereSenha(senha, admin.senhaHash)) return falhou();

  const digitos = codigo.replace(/\D/g, "");
  let detalhe = "";
  if (digitos.length === 6 && codigo.replace(/[\s-]/g, "").length === 6) {
    const passo = confereTotp(decifrar(admin.totpSegredo), digitos, admin.totpUltimoPasso);
    if (passo === null) return falhou();
    // grava só se o passo for maior que o último (evita duas entradas com o mesmo código)
    const r = await prisma.usuarioAdmin.updateMany({
      where: { id: admin.id, OR: [{ totpUltimoPasso: null }, { totpUltimoPasso: { lt: passo } }] },
      data: { totpUltimoPasso: passo },
    });
    if (r.count === 0) return falhou();
  } else {
    // código de emergência (uso único)
    const lista = (admin.codigosEmergencia as string[] | null) ?? [];
    const h = hash(`emergencia:${normalizaCodigoEmergencia(codigo)}`);
    if (!lista.includes(h)) return falhou();
    await prisma.usuarioAdmin.update({ where: { id: admin.id }, data: { codigosEmergencia: lista.filter((x) => x !== h) } });
    detalhe = `:codigo-emergencia(restam ${lista.length - 1})`;
  }

  await criarSessao({ colaboradorId: conta.colaborador?.id, adminId: admin.id, ip, userAgent });
  await prisma.registroAcesso.create({
    data: { colaboradorId: conta.colaborador?.id ?? null, email, evento: "login", detalhe: `admin:${admin.papel}:mfa${detalhe}`, ip, userAgent },
  });
  c.delete(COOKIE_EMAIL);
  redirect("/admin");
}

export async function trocarEmail() {
  const c = await cookies();
  c.delete(COOKIE_EMAIL);
  redirect("/entrar");
}
