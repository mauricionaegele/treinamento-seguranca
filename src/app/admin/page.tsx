import Link from "next/link";
import { redirect } from "next/navigation";
import { TopoAdmin } from "@/components/TopoAdmin";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/sessao";
import { formataData } from "@/lib/status";

export default async function Admin() {
  const { admin, colaborador } = await exigirAdmin();
  if (admin.papel === "GERENTE") redirect(`/admin/clientes/${admin.clienteId}`);

  const clientes = await prisma.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });
  const linhas = await Promise.all(
    clientes.map(async (c) => {
      const [total, concluidos] = await Promise.all([
        prisma.colaborador.count({ where: { clienteId: c.id, ativo: true } }),
        prisma.certificado.count({ where: { ciclo: c.cicloAtual, colaborador: { clienteId: c.id, ativo: true } } }),
      ]);
      return { ...c, total, concluidos, pct: total ? Math.round((concluidos / total) * 100) : 0 };
    }),
  );

  return (
    <>
      <TopoAdmin admin={admin} colaborador={colaborador} />
      <div className="wrap">
        <div className="titulo-pag">
          <h1>Clientes</h1>
          <Link className="btn btn-pri" href="/admin/clientes/novo">+ Novo cliente</Link>
        </div>
        <p className="muted">Acompanhe o andamento do treinamento de cada cliente no ciclo atual.</p>
        <div className="tabela-wrap">
          <table className="tabela">
            <thead><tr><th>Cliente</th><th>Ciclo</th><th>Prazo</th><th>Colaboradores</th><th>Concluíram</th><th></th></tr></thead>
            <tbody>
              {linhas.length === 0 && <tr><td colSpan={6} className="muted">Nenhum cliente ainda. Comece cadastrando um.</td></tr>}
              {linhas.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.nome}</b><span className="sub">{c.exigeProvaFinal ? "Com prova final" : "Sem prova final"} · nota mínima {c.notaMinima}%</span></td>
                  <td>{c.cicloAtual}</td>
                  <td>{formataData(c.prazo)}</td>
                  <td>{c.total}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="sum-barra" style={{ width: 90, margin: 0 }}><div style={{ width: `${c.pct}%` }} /></div>
                      <span>{c.concluidos} ({c.pct}%)</span>
                    </div>
                  </td>
                  <td><Link href={`/admin/clientes/${c.id}`}>Abrir painel →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
