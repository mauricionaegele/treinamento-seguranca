import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TopoAdmin, Mensagens } from "@/components/TopoAdmin";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/sessao";
import { adicionarColaborador, importarColaboradores } from "../../../acoes";

export default async function Importar({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string; erro?: string; avisos?: string }> }) {
  const { admin, colaborador } = await exigirAdmin();
  if (admin.papel !== "ADMIN") redirect("/admin");
  const { id } = await params;
  const busca = await searchParams;
  const cliente = await prisma.cliente.findUnique({ where: { id }, include: { _count: { select: { colaboradores: { where: { ativo: true } } } } } });
  if (!cliente) notFound();

  return (
    <>
      <TopoAdmin admin={admin} colaborador={colaborador} />
      <div className="wrap" style={{ maxWidth: 860 }}>
        <Link className="voltar" href={`/admin/clientes/${id}`}>← {cliente.nome}</Link>
        <h1>Colaboradores</h1>
        <p className="muted">{cliente._count.colaboradores} colaborador(es) ativo(s). Só quem está nesta lista consegue entrar no treinamento.</p>
        <Mensagens msg={busca.msg} erro={busca.erro} avisos={busca.avisos} />

        <form action={importarColaboradores} className="card" style={{ marginBottom: 18 }}>
          <input type="hidden" name="clienteId" value={id} />
          <h2 style={{ fontSize: 20 }}>Importar planilha</h2>
          <p className="muted" style={{ fontSize: 14 }}>
            Excel (.xlsx) ou CSV com uma linha de cabeçalho. Colunas: <b>nome</b>, <b>email</b> e, opcionalmente, <b>setor</b> e <b>gerente</b>.
            Quem já existe é atualizado; ninguém é apagado.
          </p>
          <label className="campo-form">
            <span>Arquivo</span>
            <input type="file" name="arquivo" accept=".xlsx,.csv" />
          </label>
          <label className="campo-form">
            <span>…ou cole a lista aqui</span>
            <textarea name="colado" rows={5} placeholder={"nome;email;setor;gerente\nAna Souza;ana@cliente.com.br;Financeiro;Carlos Lima"} />
          </label>
          <button className="btn btn-pri">Importar</button>
        </form>

        <form action={adicionarColaborador} className="card">
          <input type="hidden" name="clienteId" value={id} />
          <h2 style={{ fontSize: 20 }}>Adicionar uma pessoa</h2>
          <div className="grid-form">
            <label className="campo-form"><span>Nome</span><input name="nome" required /></label>
            <label className="campo-form"><span>E-mail</span><input name="email" type="email" required /></label>
            <label className="campo-form"><span>Setor</span><input name="setor" /></label>
            <label className="campo-form"><span>Gestor</span><input name="gerente" /></label>
          </div>
          <button className="btn btn-pri">Adicionar</button>
        </form>
      </div>
    </>
  );
}
