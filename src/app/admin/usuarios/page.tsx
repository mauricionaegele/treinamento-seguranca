import { redirect } from "next/navigation";
import { TopoAdmin, Mensagens } from "@/components/TopoAdmin";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/sessao";
import { desativarUsuario, salvarUsuario } from "../acoes";

export default async function Usuarios({ searchParams }: { searchParams: Promise<{ msg?: string; erro?: string }> }) {
  const { admin, colaborador } = await exigirAdmin();
  if (admin.papel !== "ADMIN") redirect("/admin");
  const busca = await searchParams;
  const [usuarios, clientes] = await Promise.all([
    prisma.usuarioAdmin.findMany({ where: { ativo: true }, include: { cliente: true }, orderBy: [{ papel: "asc" }, { nome: "asc" }] }),
    prisma.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <>
      <TopoAdmin admin={admin} colaborador={colaborador} />
      <div className="wrap" style={{ maxWidth: 900 }}>
        <h1>Usuários da área administrativa</h1>
        <p className="muted">
          <b>Administrador</b>: equipe da Broadcast, vê e gerencia todos os clientes. <b>Gestor</b>: pessoa do cliente que só consulta o painel e o relatório do próprio cliente.
          Todos entram com código enviado por e-mail.
        </p>
        <Mensagens msg={busca.msg} erro={busca.erro} />
        <div className="tabela-wrap" style={{ marginBottom: 20 }}>
          <table className="tabela">
            <thead><tr><th>Nome</th><th>Papel</th><th>Cliente</th><th></th></tr></thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td><b>{u.nome}</b><span className="sub">{u.email}</span></td>
                  <td>{u.papel === "ADMIN" ? "Administrador" : "Gestor"}</td>
                  <td>{u.cliente?.nome ?? "Todos"}</td>
                  <td>
                    {u.id !== admin.id && (
                      <form action={desativarUsuario}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="btn-link" style={{ color: "var(--muted)" }}>Remover acesso</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form action={salvarUsuario} className="card">
          <h2 style={{ fontSize: 20 }}>Dar acesso</h2>
          <div className="grid-form">
            <label className="campo-form"><span>Nome</span><input name="nome" required /></label>
            <label className="campo-form"><span>E-mail</span><input name="email" type="email" required /></label>
            <label className="campo-form">
              <span>Papel</span>
              <select name="papel" defaultValue="GERENTE">
                <option value="GERENTE">Gestor do cliente (só consulta)</option>
                <option value="ADMIN">Administrador (Broadcast)</option>
              </select>
            </label>
            <label className="campo-form">
              <span>Cliente (para gestor)</span>
              <select name="clienteId" defaultValue="">
                <option value="">—</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
          </div>
          <button className="btn btn-pri">Salvar</button>
        </form>
      </div>
    </>
  );
}
