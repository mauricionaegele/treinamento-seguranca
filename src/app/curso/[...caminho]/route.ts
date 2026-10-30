import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerSessao } from "@/lib/sessao";
import { moduloPorArquivo } from "@/lib/modulos";

// Entrega o conteúdo dos módulos (HTML, CSS, JS e áudios de conteudo/)
// somente para colaboradores logados.
const PASTA = path.join(process.cwd(), "conteudo");
const TIPOS: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mp3": "audio/mpeg",
};

function escapaHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function GET(req: NextRequest, ctx: RouteContext<"/curso/[...caminho]">) {
  const { caminho } = await ctx.params;
  const relativo = caminho.join("/");

  // links "index.html" dos módulos voltam para a página inicial do curso
  if (relativo === "index.html") return NextResponse.redirect(new URL("/", req.url));

  const sessao = await lerSessao();
  if (!sessao?.colaborador) return NextResponse.redirect(new URL("/entrar", req.url));

  const arquivo = path.normalize(path.join(PASTA, relativo));
  const ext = path.extname(arquivo);
  if (!arquivo.startsWith(PASTA + path.sep) || !TIPOS[ext]) return new NextResponse("Não encontrado", { status: 404 });

  let dados: Buffer;
  try {
    dados = await readFile(arquivo);
  } catch {
    return new NextResponse("Não encontrado", { status: 404 });
  }

  if (ext === ".html") {
    const colab = sessao.colaborador;
    const modulo = moduloPorArquivo(relativo);
    if (modulo) {
      // registra que o módulo foi aberto (data de início no ciclo atual)
      const ciclo = colab.cliente.cicloAtual;
      await prisma.progressoModulo.upsert({
        where: { colaboradorId_ciclo_modulo: { colaboradorId: colab.id, ciclo, modulo: modulo.id } },
        create: { colaboradorId: colab.id, ciclo, modulo: modulo.id },
        update: {},
      });
      await prisma.registroAcesso.create({
        data: { colaboradorId: colab.id, email: colab.email, evento: "modulo_aberto", detalhe: modulo.id, ip: (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() },
      });
    }
    const contato = escapaHtml(colab.cliente.contatoTi || "a equipe de TI da sua empresa");
    const html = dados.toString("utf-8").replaceAll("{{CONTATO_TI}}", contato);
    return new NextResponse(html, { headers: { "Content-Type": TIPOS[ext], "Cache-Control": "no-store" } });
  }

  return new NextResponse(new Uint8Array(dados), {
    headers: { "Content-Type": TIPOS[ext], "Cache-Control": "private, max-age=3600" },
  });
}
