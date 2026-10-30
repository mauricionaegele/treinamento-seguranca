import "server-only";
import ExcelJS from "exceljs";

export type LinhaImportada = { nome: string; email: string; setor: string; gerente: string };

const SINONIMOS: Record<keyof LinhaImportada, string[]> = {
  nome: ["nome", "nome completo", "colaborador", "funcionario", "funcionário"],
  email: ["email", "e-mail", "e mail", "correio"],
  setor: ["setor", "departamento", "area", "área", "depto"],
  gerente: ["gerente", "gestor", "gestor imediato", "lider", "líder", "supervisor"],
};

function normaliza(s: string) {
  return s.trim().toLowerCase();
}

function mapearCabecalho(cab: string[]) {
  const idx: Partial<Record<keyof LinhaImportada, number>> = {};
  cab.forEach((c, i) => {
    const n = normaliza(c);
    for (const [campo, nomes] of Object.entries(SINONIMOS) as [keyof LinhaImportada, string[]][]) {
      if (idx[campo] === undefined && nomes.includes(n)) idx[campo] = i;
    }
  });
  return idx;
}

function linhasParaRegistros(tabela: string[][]) {
  if (!tabela.length) return { registros: [], erros: ["Arquivo vazio."] };
  const idx = mapearCabecalho(tabela[0]);
  if (idx.nome === undefined || idx.email === undefined) {
    return { registros: [], erros: ["A primeira linha precisa ter as colunas \"nome\" e \"email\" (e, se quiser, \"setor\" e \"gerente\")."] };
  }
  const registros: LinhaImportada[] = [];
  const erros: string[] = [];
  tabela.slice(1).forEach((l, i) => {
    const pega = (k: keyof LinhaImportada) => (idx[k] !== undefined ? String(l[idx[k]!] ?? "").trim() : "");
    const r = { nome: pega("nome"), email: normaliza(pega("email")), setor: pega("setor"), gerente: pega("gerente") };
    if (!r.nome && !r.email) return; // linha em branco
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) erros.push(`Linha ${i + 2}: e-mail inválido (${r.email || "vazio"}).`);
    else if (!r.nome) erros.push(`Linha ${i + 2}: nome vazio.`);
    else registros.push(r);
  });
  return { registros, erros };
}

function lerCsv(texto: string): string[][] {
  const primeira = texto.split(/\r?\n/)[0] ?? "";
  const sep = (primeira.match(/;/g) ?? []).length >= (primeira.match(/,/g) ?? []).length ? ";" : ",";
  const linhas: string[][] = [];
  let campo = "", linha: string[] = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (aspas) {
      if (ch === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (ch === '"') aspas = false;
      else campo += ch;
    } else if (ch === '"') aspas = true;
    else if (ch === sep) { linha.push(campo); campo = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = "";
    } else campo += ch;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

function textoCelula(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if ("text" in v && typeof v.text === "string") return v.text; // hyperlink
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("result" in v) return String(v.result ?? "");
  }
  return String(v);
}

/** Aceita .xlsx ou .csv (separado por ; ou ,). */
export async function lerPlanilha(nomeArquivo: string, dados: ArrayBuffer) {
  if (/\.xlsx$/i.test(nomeArquivo)) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(dados);
    const ws = wb.worksheets[0];
    if (!ws) return { registros: [], erros: ["Planilha sem abas."] };
    const tabela: string[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const vals = row.values as ExcelJS.CellValue[];
      tabela.push(vals.slice(1).map(textoCelula));
    });
    return linhasParaRegistros(tabela);
  }
  let texto = new TextDecoder("utf-8").decode(dados);
  if (texto.includes("�")) texto = new TextDecoder("windows-1252").decode(dados); // CSV salvo pelo Excel
  return linhasParaRegistros(lerCsv(texto.replace(/^﻿/, "")));
}

export function lerTextoColado(texto: string) {
  return linhasParaRegistros(lerCsv(texto.trim()));
}
