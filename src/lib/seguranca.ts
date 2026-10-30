import "server-only";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";

/** Hash com "sal" do servidor: o banco nunca guarda códigos ou tokens em texto. */
export function hash(valor: string) {
  const segredo = process.env.AUTH_SECRET ?? "";
  // checado no uso (e não ao carregar), porque o build roda sem as variáveis de produção
  if (!segredo && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET não configurado");
  return createHash("sha256").update(`${segredo}:${valor}`).digest("hex");
}

export function iguais(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function tokenAleatorio() {
  return randomBytes(32).toString("base64url");
}

export function codigoSeisDigitos() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Código de certificado legível: ABCD-EFGH-JKLM (sem letras ambíguas). */
export function codigoCertificado() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const partes = [0, 1, 2].map(() =>
    Array.from({ length: 4 }, () => letras[randomInt(0, letras.length)]).join(""),
  );
  return partes.join("-");
}

export function normalizaEmail(email: string) {
  return email.trim().toLowerCase();
}

/** IP e navegador de quem fez a requisição (atrás do Apache). */
export async function origemRequisicao() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "";
  return { ip, userAgent: (h.get("user-agent") ?? "").slice(0, 300) };
}
