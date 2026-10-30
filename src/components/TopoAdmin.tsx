import { Topo } from "./Topo";

export function TopoAdmin({ admin, colaborador }: { admin: { nome: string; papel: string }; colaborador?: unknown }) {
  const links = [{ href: "/admin", texto: admin.papel === "ADMIN" ? "Clientes" : "Painel" }];
  if (admin.papel === "ADMIN") links.push({ href: "/admin/usuarios", texto: "Usuários" });
  if (colaborador) links.push({ href: "/", texto: "Meu treinamento" });
  return <Topo inicio="/admin" quem={`${admin.nome} · ${admin.papel === "ADMIN" ? "Administrador" : "Gestor"}`} links={links} />;
}

export function Mensagens({ msg, erro, avisos }: { msg?: string; erro?: string; avisos?: string }) {
  return (
    <>
      {msg && <div className="ok">{msg}</div>}
      {erro && <div className="erro">{erro}</div>}
      {avisos && (
        <div className="erro" style={{ whiteSpace: "pre-line" }}>
          <b>Linhas ignoradas:</b>
          {"\n" + avisos}
        </div>
      )}
    </>
  );
}
