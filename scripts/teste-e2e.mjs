// Teste de ponta a ponta com o Edge (puppeteer-core), contra o servidor de desenvolvimento.
// Uso: LOG=<arquivo de log do npm run dev> node scripts/teste-e2e.mjs
// Precisa do seed com SEED_DEMO=1 e SEED_ADMIN_EMAIL=admin@demo.broadcastti.com.br.
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { createHmac } from "node:crypto";

const BASE = process.env.BASE ?? "http://localhost:3500";
const LOG = process.env.LOG;
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const COLAB = process.env.COLAB ?? "ana@demo.broadcastti.com.br";
const ADMIN = process.env.ADMIN ?? "admin@demo.broadcastti.com.br";
let falhas = 0;
const ok = (cond, msg) => { console.log(`${cond ? "✓" : "✗"} ${msg}`); if (!cond) falhas++; };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// código do Google Authenticator calculado aqui, como o celular faria
function totp(segredo, passo = Math.floor(Date.now() / 30000)) {
  const alf = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, v = 0; const bytes = [];
  for (const c of segredo.replace(/\s/g, "")) { v = (v << 5) | alf.indexOf(c); bits += 5; if (bits >= 8) { bytes.push((v >>> (bits - 8)) & 255); bits -= 8; } }
  const cont = Buffer.alloc(8); cont.writeBigUInt64BE(BigInt(passo));
  const h = createHmac("sha1", Buffer.from(bytes)).update(cont).digest();
  const o = h[h.length - 1] & 15;
  return ((h.readUInt32BE(o) & 0x7fffffff) % 1e6).toString().padStart(6, "0");
}
const SENHA_ADMIN = "senha-de-teste-123";

// sem LOG_CMD (desenvolvimento): zera o autenticador do admin de teste para o teste poder repetir
if (!process.env.LOG_CMD) {
  execSync(`docker exec treinamento-postgres-dev psql -U treinamento -d treinamento -c "UPDATE \\"UsuarioAdmin\\" SET \\"senhaHash\\"=NULL, \\"totpSegredo\\"=NULL, \\"totpAtivo\\"=false, \\"totpUltimoPasso\\"=NULL, \\"codigosEmergencia\\"=NULL WHERE email='${ADMIN}'"`, { stdio: "ignore" });
}

async function entrarComSenha(page, email, codigo) {
  await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle0" });
  await page.type("input[name=email]", email);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), page.click("button.btn-pri")]);
  await page.type("input[name=senha]", SENHA_ADMIN);
  await page.type("input[name=codigo]", codigo);
  await page.click("button.btn-pri");
  await espera(1500);
}

// respostas certas (lidas do servidor só para o teste)
const gabarito = JSON.parse(execSync("npx tsx scripts/gabarito.ts", { encoding: "utf8" }));

function ultimoCodigo(email) {
  // LOG_CMD: comando que imprime o log (ex.: ssh ... docker logs) para testar em produção
  const texto = process.env.LOG_CMD ? execSync(process.env.LOG_CMD, { encoding: "utf8" }) : readFileSync(LOG, "utf8");
  const linhas = texto.split("\n").filter((l) => l.includes(`[EMAIL-TESTE] para=${email}`) && l.includes("código"));
  const m = linhas.at(-1)?.match(/é (\d{6})/);
  return m?.[1];
}

async function entrar(page, email) {
  await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle0" });
  await page.type("input[name=email]", email);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), page.click("button.btn-pri")]);
  await espera(500);
  const codigo = ultimoCodigo(email);
  ok(!!codigo, `código enviado para ${email}`);
  // primeiro um código errado
  await page.type("input[name=codigo]", "000000");
  await page.click("button.btn-pri");
  await page.waitForSelector(".erro");
  ok((await page.$eval(".erro", (e) => e.textContent)).includes("incorreto"), "código errado é recusado");
  await page.$eval("input[name=codigo]", (e) => (e.value = ""));
  await page.type("input[name=codigo]", codigo);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), page.click("button.btn-pri")]);
}

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ["--no-first-run"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // ---------- Colaborador
  await entrar(page, COLAB);
  ok(page.url() === `${BASE}/`, "colaborador cai na página do curso");
  ok((await page.content()).includes("Prova final e certificado"), "prova aparece bloqueada");

  await page.goto(`${BASE}/curso/modulo-7-incidentes.html`, { waitUntil: "networkidle0" });
  const html7 = await page.content();
  ok(html7.includes("suporte@broadcastti.com.br") && !html7.includes("{{CONTATO_TI}}"), "contato da TI do cliente aparece no módulo");
  ok(!html7.includes("const perguntas") && !html7.includes("Equipamento perdido ou roubado é incidente"), "módulo não traz as respostas do quiz");
  await page.goto(`${BASE}/curso/audio/ana-1.mp3`);
  await page.goto(`${BASE}/curso/../.env`).catch(() => {});
  ok(!(await page.content()).includes("AUTH_SECRET"), "não dá para ler arquivos fora do conteúdo");

  // quizzes via API (mesma origem, com o cookie da sessão)
  for (const [modulo, respostas] of Object.entries(gabarito.quizzes)) {
    const r = await page.evaluate(async (modulo, respostas, errarPrimeira) => {
      const api = (b) => fetch("/api/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((x) => x.json());
      const ini = await api({ acao: "iniciar", modulo });
      let ultimo;
      for (let i = 0; i < ini.perguntas.length; i++) {
        const opcao = errarPrimeira && i === 0 ? (respostas[i] + 1) % ini.perguntas[i].o.length : respostas[i];
        ultimo = await api({ acao: "responder", tentativa: ini.tentativa, indice: i, opcao });
        if (i === 0) await api({ acao: "responder", tentativa: ini.tentativa, indice: 0, opcao: respostas[0] }); // tentar trocar não vale
      }
      return ultimo;
    }, modulo, respostas, modulo === "ameacas");
    ok(r.fim && r.nota === (modulo === "ameacas" ? 80 : 100), `quiz ${modulo}: nota ${r.nota} calculada no servidor`);
  }
  const forjado = await page.evaluate(() => fetch("/api/progresso", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modulo: "lgpd", nota: 100 }) }).then((r) => r.status));
  ok(forjado === 404, "não existe mais rota para enviar nota direto");

  await page.goto(`${BASE}/`, { waitUntil: "networkidle0" });
  ok((await page.content()).includes("Prova final liberada"), "prova libera após os 7 módulos");

  // prova: 1ª tentativa errando tudo de propósito
  async function fazerProva(acertar) {
    await page.goto(`${BASE}/prova`, { waitUntil: "networkidle0" });
    const comecar = await page.$("form button.btn-pri");
    if (comecar && (await page.evaluate((b) => b.textContent, comecar)).includes("Começar")) {
      await comecar.click();
      await page.waitForSelector("fieldset.questao");
    }
    const questoes = await page.$$("fieldset.questao");
    for (const q of questoes) {
      const texto = await q.$eval("h3", (e) => e.textContent);
      const certa = gabarito.prova[texto];
      const opcoes = await q.$$("label.alt");
      let escolhida = opcoes[0];
      for (const o of opcoes) {
        const t = await o.$eval("span", (e) => e.textContent);
        if (acertar ? t === certa : t !== certa) { escolhida = o; break; }
      }
      await escolhida.$eval("input", (i) => i.click());
    }
    await page.click(".barra-prova button");
    await page.waitForSelector(".nota");
    return page.$eval(".nota", (e) => e.textContent);
  }
  const nota1 = await fazerProva(false);
  ok(nota1 === "0%", `prova errando tudo: ${nota1}`);
  const nota2 = await fazerProva(true);
  ok(nota2 === "100%", `prova acertando tudo: ${nota2}`);
  const link = await page.$eval("a.btn-pri", (a) => a.getAttribute("href"));
  ok(link.startsWith("/certificado/"), "aprovação gera certificado");
  await page.goto(`${BASE}${link}`, { waitUntil: "networkidle0" });
  const cert = await page.content();
  ok(cert.includes(process.env.NOME ?? "Ana Souza") && cert.includes("Certificado autêntico") && cert.includes("Válido até"), "certificado mostra nome, autenticidade e validade");
  await page.screenshot({ path: process.env.PRINTS ? `${process.env.PRINTS}/e2e-certificado.png` : "e2e-certificado.png" });

  // certificado é público (outra sessão, sem login)
  const anon = await browser.createBrowserContext();
  const p2 = await anon.newPage();
  await p2.goto(`${BASE}${link}`, { waitUntil: "networkidle0" });
  ok((await p2.content()).includes(process.env.NOME ?? "Ana Souza"), "certificado pode ser verificado sem login");
  await p2.goto(`${BASE}/admin`, { waitUntil: "networkidle0" });
  ok(p2.url().endsWith("/entrar"), "área administrativa exige login");
  await anon.close();

  // ---------- Admin
  await page.goto(`${BASE}/sair`, { waitUntil: "networkidle0" });
  await entrar(page, ADMIN);
  ok(page.url() === `${BASE}/entrar/configurar`, "primeiro acesso do administrador pede para configurar o autenticador");
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle0" });
  ok(page.url() === `${BASE}/entrar/configurar`, "sem configurar, não abre a área administrativa");
  const segredo = await page.$eval(".chave-totp", (e) => e.textContent);
  ok(!!(await page.$("img[alt^='QR code']")), "QR code aparece");
  await page.type("input[name=senha]", SENHA_ADMIN);
  await page.type("input[name=confirma]", SENHA_ADMIN);
  await page.type("input[name=codigo]", "123456");
  await page.click("form button.btn-pri");
  await page.waitForSelector(".erro");
  ok((await page.$eval(".erro", (e) => e.textContent)).includes("incorreto"), "código errado do aplicativo é recusado");
  await page.$eval("input[name=codigo]", (e) => (e.value = ""));
  await page.$eval("input[name=senha]", (e) => (e.value = ""));
  await page.$eval("input[name=confirma]", (e) => (e.value = ""));
  await page.type("input[name=senha]", SENHA_ADMIN);
  await page.type("input[name=confirma]", SENHA_ADMIN);
  await page.type("input[name=codigo]", totp(segredo));
  await page.click("form button.btn-pri");
  await page.waitForSelector(".codigos-emergencia code");
  const emergencia = await page.$$eval(".codigos-emergencia code", (cs) => cs.map((c) => c.textContent));
  ok(emergencia.length === 8, "8 códigos de emergência gerados");
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), page.click("form button.btn-pri")]);
  ok(page.url() === `${BASE}/admin`, "após configurar, administrador cai na lista de clientes");

  // segundo login: senha + autenticador, sem código por e-mail
  await page.goto(`${BASE}/sair`, { waitUntil: "networkidle0" });
  await entrarComSenha(page, ADMIN, "000000");
  ok(page.url().includes("etapa=senha") && (await page.content()).includes("incorreto"), "administrador entra por senha (sem código no e-mail) e código errado é recusado");
  await entrarComSenha(page, ADMIN, emergencia[0].toLowerCase());
  ok(page.url() === `${BASE}/admin`, "código de emergência funciona");
  await page.goto(`${BASE}/sair`, { waitUntil: "networkidle0" });
  await entrarComSenha(page, ADMIN, emergencia[0]);
  ok(!page.url().endsWith("/admin"), "código de emergência não vale duas vezes");
  // espera o próximo código do aplicativo (o usado na configuração não pode ser reaproveitado)
  await espera((30 - (Math.floor(Date.now() / 1000) % 30)) * 1000 + 500);
  await entrarComSenha(page, ADMIN, totp(segredo));
  ok(page.url() === `${BASE}/admin`, "senha + código do aplicativo funciona");
  ok((await page.content()).includes("Cliente Demonstração"), "cliente de demonstração aparece");
  await page.click("a[href^='/admin/clientes/c']");
  await page.waitForSelector(".stats");
  const painel = await page.content();
  ok(painel.includes("Ana Souza") && painel.includes("Concluído"), "painel mostra Ana como concluída");
  await page.screenshot({ path: process.env.PRINTS ? `${process.env.PRINTS}/e2e-painel.png` : "e2e-painel.png", fullPage: true });
  const idCliente = page.url().split("/").pop();
  const xlsx = await page.evaluate((id) => fetch(`/admin/clientes/${id}/exportar`).then((r) => r.headers.get("content-type")), idCliente);
  ok(xlsx?.includes("spreadsheetml"), "exportação Excel funciona");
  await page.goto(`${BASE}/admin/clientes/${idCliente}/relatorio`, { waitUntil: "networkidle0" });
  ok((await page.content()).includes("Situação individual"), "relatório abre");
  await page.screenshot({ path: process.env.PRINTS ? `${process.env.PRINTS}/e2e-relatorio.png` : "e2e-relatorio.png", fullPage: true });

  // importação colando texto
  await page.goto(`${BASE}/admin/clientes/${idCliente}/importar`, { waitUntil: "networkidle0" });
  await page.type("textarea[name=colado]", "nome;email;setor;gerente\nEduardo Teste;eduardo@demo.broadcastti.com.br;TI;Paula Reis\nSem Email;;TI;");
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), page.click("form button.btn-pri")]);
  const imp = await page.content();
  ok(imp.includes("1 colaborador(es) novo(s)") && imp.includes("Linha 3"), "importação adiciona válidos e aponta linha com erro");

  // lembretes
  await page.goto(`${BASE}/admin/clientes/${idCliente}`, { waitUntil: "networkidle0" });
  const btnLembrete = await page.$("form button.btn-pri");
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), btnLembrete.click()]);
  ok((await page.content()).includes("Lembrete enviado para 4 de 4"), "lembretes enviados aos pendentes");

  await page.goto(`${BASE}/admin/usuarios`, { waitUntil: "networkidle0" });
  const usuarios = await page.$eval("body", (b) => b.innerText);
  ok(usuarios.includes("Dar acesso") && usuarios.includes("7 códigos de emergência"), "tela de usuários mostra o autenticador e os códigos restantes");
} finally {
  await browser.close();
}
console.log(falhas ? `\n${falhas} FALHA(S)` : "\nTudo certo");
process.exit(falhas ? 1 : 0);
