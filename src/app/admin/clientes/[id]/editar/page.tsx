import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TopoAdmin, Mensagens } from "@/components/TopoAdmin";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/sessao";
import { FormCliente } from "../../FormCliente";
import { iniciarNovoCiclo } from "../../../acoes";

export default async function EditarCliente({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erro?: string }> }) {
  const { admin, colaborador } = await exigirAdmin();
  if (admin.papel !== "ADMIN") redirect("/admin");
  const { id } = await params;
  const { erro } = await searchParams;
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) notFound();
  const proximo = cliente.cicloAtual + 1;

  return (
    <>
      <TopoAdmin admin={admin} colaborador={colaborador} />
      <div className="wrap" style={{ maxWidth: 760 }}>
        <Link className="voltar" href={`/admin/clientes/${id}`}>← {cliente.nome}</Link>
        <h1>Configurações do cliente</h1>
        <Mensagens erro={erro} />
        <FormCliente cliente={cliente} />

        <details className="caixa">
          <summary>Iniciar novo ciclo ({proximo})</summary>
          <p className="muted" style={{ marginTop: 10 }}>
            Use quando começar o treinamento do próximo ano. Todos os colaboradores voltam a &quot;não iniciado&quot; e precisam refazer o curso.
            Os certificados e notas de {cliente.cicloAtual} continuam guardados.
          </p>
          <form action={iniciarNovoCiclo} className="acoes-linha">
            <input type="hidden" name="clienteId" value={id} />
            <label className="campo-form" style={{ margin: 0 }}>
              <span>Para confirmar, digite {proximo}</span>
              <input name="confirmacao" required />
            </label>
            <button className="btn btn-perigo" style={{ alignSelf: "flex-end" }}>Iniciar ciclo {proximo}</button>
          </form>
        </details>
      </div>
    </>
  );
}
