import Link from "next/link";
import { redirect } from "next/navigation";
import { TopoAdmin, Mensagens } from "@/components/TopoAdmin";
import { exigirAdmin } from "@/lib/sessao";
import { FormCliente } from "../FormCliente";

export default async function NovoCliente({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { admin, colaborador } = await exigirAdmin();
  if (admin.papel !== "ADMIN") redirect("/admin");
  const { erro } = await searchParams;
  return (
    <>
      <TopoAdmin admin={admin} colaborador={colaborador} />
      <div className="wrap" style={{ maxWidth: 760 }}>
        <Link className="voltar" href="/admin">← Clientes</Link>
        <h1>Novo cliente</h1>
        <Mensagens erro={erro} />
        <FormCliente />
      </div>
    </>
  );
}
