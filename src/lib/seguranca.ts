import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";

/** Senha guardada com scrypt (lento de propósito, com sal próprio). */
export function hashSenha(senha: string) {
  const sal = randomBytes(16);
  const h = scryptSync(senha, sal, 64);
  return `scrypt$${sal.toString("base64")}$${h.toString("base64")}`;
}

export function confereSenha(senha: string, guardado: string | null) {
  if (!guardado) return false;
  const [tipo, sal, h] = guardado.split("$");
  if (tipo !== "scrypt" || !sal || !h) return false;
  const esperado = Buffer.from(h, "base64");
  const calculado = scryptSync(senha, Buffer.from(sal, "base64"), esperado.length);
  return timingSafeEqual(esperado, calculado);
}

/** Cifra (AES-256-GCM) para o segredo do autenticador, com chave derivada do AUTH_SECRET. */
function chave() {
  return createHash("sha256").update(`${process.env.AUTH_SECRET ?? ""}:totp`).digest();
}

export function cifrar(texto: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", chave(), iv);
  const dados = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), dados].map((b) => b.toString("base64")).join(".");
}

export function decifrar(cifrado: string) {
  const [iv, tag, dados] = cifrado.split(".").map((p) => Buffer.from(p, "base64"));
  const d = createDecipheriv("aes-256-gcm", chave(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(dados), d.final()]).toString("utf8");
}

/** Códigos de emergência: 8 códigos ABCD-EFGH de uso único. */
export function novosCodigosEmergencia() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => {
    const s = Array.from({ length: 8 }, () => letras[randomInt(0, letras.length)]).join("");
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });
}

export function normalizaCodigoEmergencia(codigo: string) {
  return codigo.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

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
