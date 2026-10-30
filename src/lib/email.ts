import "server-only";
import nodemailer from "nodemailer";

// Sem SMTP_HOST configurado, o sistema fica em "modo teste": os e-mails
// não são enviados, aparecem no registro do servidor (docker logs).
const host = process.env.SMTP_HOST;
const transporte = host
  ? nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;

const REMETENTE = process.env.SMTP_FROM ?? "Segurança em Dia <nao-responda@broadcastti.com.br>";
export const URL_BASE = (process.env.URL_BASE ?? "http://localhost:3500").replace(/\/$/, "");

function moldura(titulo: string, corpo: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:Segoe UI,Arial,sans-serif;color:#1d2433">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
  <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden">
    <tr><td style="background:#0f1f3d;color:#fff;padding:18px 24px;font-weight:700;font-size:16px">🛡️ Segurança em Dia</td></tr>
    <tr><td style="padding:28px 24px"><h2 style="margin:0 0 14px;color:#0f1f3d;font-size:20px">${titulo}</h2>${corpo}</td></tr>
    <tr><td style="padding:14px 24px;background:#f7f9fc;color:#5b6478;font-size:12px">Treinamento de conscientização em segurança da informação. Se você não esperava este e-mail, pode ignorá-lo.</td></tr>
  </table></td></tr></table></body></html>`;
}

async function enviar(para: string, assunto: string, html: string, texto: string) {
  if (!transporte) {
    console.log(`[EMAIL-TESTE] para=${para} assunto="${assunto}" :: ${texto}`);
    return;
  }
  await transporte.sendMail({ from: REMETENTE, to: para, subject: assunto, html, text: texto });
}

export async function enviarCodigo(para: string, codigo: string) {
  const html = moldura(
    "Seu código de acesso",
    `<p style="margin:0 0 18px">Use o código abaixo para entrar no treinamento. Ele vale por <b>10 minutos</b>.</p>
     <div style="font-size:34px;font-weight:800;letter-spacing:8px;text-align:center;background:#e2f6f4;color:#0f1f3d;border-radius:12px;padding:16px">${codigo}</div>
     <p style="margin:18px 0 0;color:#5b6478;font-size:13px">Nunca passe este código para ninguém, nem para a equipe de TI. Ele serve só para você entrar.</p>`,
  );
  await enviar(para, `Seu código de acesso: ${codigo}`, html, `Seu código de acesso ao treinamento é ${codigo} (vale por 10 minutos).`);
}

export async function enviarLembrete(para: string, nome: string, prazo: Date | null) {
  const quando = prazo ? ` até <b>${prazo.toLocaleDateString("pt-BR", { timeZone: "UTC" })}</b>` : "";
  const html = moldura(
    `Olá, ${nome.split(" ")[0]}! Seu treinamento está esperando`,
    `<p style="margin:0 0 18px">Falta pouco para você concluir o treinamento anual de segurança da informação. São módulos curtos, com vídeos e atividades práticas. Conclua${quando}.</p>
     <p style="text-align:center;margin:24px 0"><a href="${URL_BASE}/entrar" style="background:#13a89e;color:#fff;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:12px;display:inline-block">Continuar o treinamento</a></p>
     <p style="margin:0;color:#5b6478;font-size:13px">Para entrar, digite seu e-mail e você recebe um código de acesso. Este e-mail nunca pede senha.</p>`,
  );
  await enviar(para, "Lembrete: conclua seu treinamento de segurança", html, `Conclua seu treinamento de segurança em ${URL_BASE}/entrar`);
}
