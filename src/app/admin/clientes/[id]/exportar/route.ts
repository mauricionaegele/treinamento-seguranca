import ExcelJS from "exceljs";
import { NextResponse, type NextRequest } from "next/server";
import { lerSessao, podeVerCliente } from "@/lib/sessao";
import { situacaoDoCliente, formataData, ROTULO_SITUACAO } from "@/lib/status";
import { MODULOS } from "@/lib/modulos";

export async function GET(req: NextRequest, ctx: RouteContext<"/admin/clientes/[id]/exportar">) {
  const sessao = await lerSessao();
  const { id } = await ctx.params;
  if (!sessao?.admin || !podeVerCliente(sessao.admin, id)) return new NextResponse("Sem permissão", { status: 403 });

  const { cliente, linhas } = await situacaoDoCliente(id);
  const setor = req.nextUrl.searchParams.get("setor");
  const situacao = req.nextUrl.searchParams.get("situacao");
  const filtradas = linhas.filter((l) => (!setor || l.setor === setor) && (!situacao || l.situacao === situacao));

  const wb = new ExcelJS.Workbook();
  wb.creator = "Segurança em Dia";
  const ws = wb.addWorksheet(`Ciclo ${cliente.cicloAtual}`);
  ws.columns = [
    { header: "Nome", key: "nome", width: 30 },
    { header: "E-mail", key: "email", width: 32 },
    { header: "Setor", key: "setor", width: 18 },
    { header: "Gestor", key: "gerente", width: 22 },
    { header: "Situação", key: "situacao", width: 15 },
    { header: "Módulos concluídos", key: "modulos", width: 12 },
    ...MODULOS.map((m, i) => ({ header: `M${i + 1} ${m.titulo.split(":")[0]}`, key: m.id, width: 14 })),
    { header: "Tentativas da prova", key: "tentativas", width: 12 },
    { header: "Nota final", key: "nota", width: 10 },
    { header: "Concluído em", key: "concluido", width: 14 },
    { header: "Válido até", key: "validade", width: 14 },
    { header: "Código do certificado", key: "codigo", width: 18 },
    { header: "Último acesso", key: "acesso", width: 18 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F1F3D" } };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  for (const l of filtradas) {
    ws.addRow({
      nome: l.nome, email: l.email, setor: l.setor, gerente: l.gerente,
      situacao: ROTULO_SITUACAO[l.situacao],
      modulos: l.modulosConcluidos,
      ...Object.fromEntries(l.modulos.map((m) => [m.id, m.concluido ? `${m.nota}% (${formataData(m.concluidoEm)})` : m.iniciado ? "iniciado" : ""])),
      tentativas: l.tentativasProva,
      nota: l.certificado?.nota ?? l.melhorNotaProva ?? "",
      concluido: formataData(l.certificado?.emitidoEm),
      validade: formataData(l.certificado?.validoAte),
      codigo: l.certificado?.codigo ?? "",
      acesso: formataData(l.ultimoAcesso, true),
    });
  }
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columns.length } };

  const buf = await wb.xlsx.writeBuffer();
  const nome = `treinamento-${cliente.nome.replace(/[^\w]+/g, "-").toLowerCase()}-${cliente.cicloAtual}.xlsx`;
  return new NextResponse(new Uint8Array(buf as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nome}"`,
    },
  });
}
