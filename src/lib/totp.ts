import "server-only";
import { createHmac, randomBytes } from "node:crypto";

// Códigos do Google Authenticator (TOTP, RFC 6238): o celular e o servidor
// calculam o mesmo número de 6 dígitos a partir de um segredo e da hora.
const PASSO_SEG = 30;
const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32(buf: Buffer) {
  let bits = 0, valor = 0, saida = "";
  for (const byte of buf) {
    valor = (valor << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      saida += ALFABETO[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) saida += ALFABETO[(valor << (5 - bits)) & 31];
  return saida;
}

function deBase32(texto: string) {
  let bits = 0, valor = 0;
  const bytes: number[] = [];
  for (const c of texto.replace(/[\s=]/g, "").toUpperCase()) {
    const i = ALFABETO.indexOf(c);
    if (i < 0) continue;
    valor = (valor << 5) | i;
    bits += 5;
    if (bits >= 8) {
      bytes.push((valor >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function novoSegredoTotp() {
  return base32(randomBytes(20));
}

export function passoAtual(agora = Date.now()) {
  return Math.floor(agora / 1000 / PASSO_SEG);
}

export function codigoTotp(segredo: string, passo: number) {
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(passo));
  const h = createHmac("sha1", deBase32(segredo)).update(contador).digest();
  const o = h[h.length - 1] & 15;
  const n = (h.readUInt32BE(o) & 0x7fffffff) % 1_000_000;
  return n.toString().padStart(6, "0");
}

/**
 * Confere o código aceitando 30 s de diferença de relógio para cada lado.
 * Devolve o passo usado (para impedir reutilização) ou null.
 */
export function confereTotp(segredo: string, codigo: string, ultimoPasso: number | null) {
  const agora = passoAtual();
  for (const p of [agora - 1, agora, agora + 1]) {
    if (ultimoPasso !== null && p <= ultimoPasso) continue;
    if (codigoTotp(segredo, p) === codigo) return p;
  }
  return null;
}

export function linkAutenticador(segredo: string, email: string) {
  const emissor = "Segurança em Dia";
  return `otpauth://totp/${encodeURIComponent(`${emissor}:${email}`)}?secret=${segredo}&issuer=${encodeURIComponent(emissor)}&algorithm=SHA1&digits=6&period=${PASSO_SEG}`;
}
