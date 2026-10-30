"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { enviarCodigo } from "@/lib/email";
import { codigoSeisDigitos, hash, iguais, normalizaEmail, origemRequisicao } from "@/lib/seguranca";
import { criarSessao } from "@/lib/sessao";

const COOKIE_EMAIL = "login_email";
const VALIDADE_MIN = 10;
const MAX_CODIGOS_HORA = 5;
const MAX_TENTATIVAS = 5;

export type EstadoLogin = { erro?: string; aviso?: string };

async function contaDoEmail(email: string) {
  const [colaborador, admin] = await Promise.all([
    prisma.colaborador.findUnique({ where: { email }, include: { cliente: true } }),
    prisma.usuarioAdmin.findUnique({ where: { email } }),
  ]);
  return {
    colaborador: colaborador?.ativo && colaborador.cliente.ativo ? colaborador : null,
    admin: admin?.ativo ? admin : null,
  };
}

export async function solicitarCodigo(_: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const email = normalizaEmail(String(form.get("email") ?? ""));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { erro: "Digite um e-mail válido." };

  const { ip } = await origemRequisicao();
  const umaHora = new Date(Date.now() - 3600_000);
  const recentes = await prisma.codigoAcesso.count({ where: { email, criadoEm: { gte: umaHora } } });
  if (recentes >= MAX_CODIGOS_HORA) {
    return { erro: "Muitos códigos pedidos para este e-mail. Aguarde alguns minutos e tente de novo." };
  }

  const conta = await contaDoEmail(email);
  // Só gera e envia código para quem está cadastrado. A tela é a mesma nos
  // dois casos, para não revelar quais e-mails existem no sistema.
  if (conta.colaborador || conta.admin) {
    const codigo = codigoSeisDigitos();
    await prisma.codigoAcesso.create({
      data: { email, codigoHash: hash(codigo), expiraEm: new Date(Date.now() + VALIDADE_MIN * 60_000), ip },
    });
    await enviarCodigo(email, codigo);
  }

  const c = await cookies();
  c.set(COOKIE_EMAIL, email, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 900, path: "/" });
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

  const { ip, userAgent } = await origemRequisicao();
  await criarSessao({ colaboradorId: conta.colaborador?.id, adminId: conta.admin?.id, ip, userAgent });
  await prisma.registroAcesso.create({
    data: { colaboradorId: conta.colaborador?.id ?? null, email, evento: "login", detalhe: conta.admin ? `admin:${conta.admin.papel}` : "", ip, userAgent },
  });
  c.delete(COOKIE_EMAIL);
  redirect(conta.colaborador ? "/" : "/admin");
}

export async function trocarEmail() {
  const c = await cookies();
  c.delete(COOKIE_EMAIL);
  redirect("/entrar");
}
