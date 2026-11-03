import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { hash, tokenAleatorio } from "./seguranca";

export const COOKIE_SESSAO = "sessao";
const DURACAO_DIAS = 7;

export async function criarSessao(dados: {
  colaboradorId?: string | null;
  adminId?: string | null;
  adminPendente?: boolean;
  ip: string;
  userAgent: string;
}) {
  const token = tokenAleatorio();
  const expiraEm = new Date(Date.now() + DURACAO_DIAS * 86400_000);
  await prisma.sessao.create({
    data: {
      tokenHash: hash(token),
      colaboradorId: dados.colaboradorId ?? null,
      adminId: dados.adminId ?? null,
      adminPendente: dados.adminPendente ?? false,
      expiraEm,
      ip: dados.ip,
      userAgent: dados.userAgent,
    },
  });
  const c = await cookies();
  c.set(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiraEm,
  });
}

export async function lerSessao() {
  const c = await cookies();
  const token = c.get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  const s = await prisma.sessao.findUnique({
    where: { tokenHash: hash(token) },
    include: {
      colaborador: { include: { cliente: true } },
      admin: { include: { cliente: true } },
    },
  });
  if (!s || s.expiraEm < new Date()) return null;
  // conta desativada perde o acesso na hora
  const colaborador = s.colaborador?.ativo && s.colaborador.cliente.ativo ? s.colaborador : null;
  const adminValido = s.admin?.ativo ? s.admin : null;
  // admin que entrou só com o código do e-mail: ainda não pode usar a área
  // administrativa, só a tela de configurar senha + autenticador
  const admin = adminValido && !s.adminPendente ? adminValido : null;
  const adminPendente = adminValido && s.adminPendente ? adminValido : null;
  if (!colaborador && !admin && !adminPendente) return null;
  return { id: s.id, colaborador, admin, adminPendente };
}

export async function encerrarSessao() {
  const c = await cookies();
  const token = c.get(COOKIE_SESSAO)?.value;
  if (token) await prisma.sessao.deleteMany({ where: { tokenHash: hash(token) } });
  c.delete(COOKIE_SESSAO);
}

/** Para páginas do curso: exige colaborador logado. */
export async function exigirColaborador() {
  const s = await lerSessao();
  if (!s) redirect("/entrar");
  if (!s.colaborador) redirect("/admin");
  return { ...s, colaborador: s.colaborador };
}

/** Para a área administrativa. GERENTE só enxerga o próprio cliente. */
export async function exigirAdmin() {
  const s = await lerSessao();
  if (!s) redirect("/entrar");
  if (s.adminPendente) redirect("/entrar/configurar");
  if (!s.admin) redirect("/");
  return { ...s, admin: s.admin };
}

/** Administradores sempre usam senha + autenticador; gestores, se o cliente exigir. */
export function exigeMfa(admin: { papel: string; cliente?: { gestorMfa: boolean } | null }) {
  return admin.papel === "ADMIN" || !!admin.cliente?.gestorMfa;
}

export function podeVerCliente(admin: { papel: string; clienteId: string | null }, clienteId: string) {
  return admin.papel === "ADMIN" || admin.clienteId === clienteId;
}
