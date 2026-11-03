import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Escudo } from "@/components/Topo";
import { lerSessao } from "@/lib/sessao";
import { FormCodigo, FormEmail, FormSenha } from "./Formularios";

export default async function Entrar({ searchParams }: { searchParams: Promise<{ etapa?: string }> }) {
  const sessao = await lerSessao();
  if (sessao?.adminPendente) redirect("/entrar/configurar");
  if (sessao) redirect(sessao.colaborador ? "/" : "/admin");

  const { etapa } = await searchParams;
  const email = (await cookies()).get("login_email")?.value;

  return (
    <div className="login-fundo">
      <div className="login-caixa">
        <div className="marca"><Escudo tamanho={36} /> Segurança em Dia</div>
        <div className="card">
          {etapa === "codigo" && email ? <FormCodigo email={email} />
            : etapa === "senha" && email ? <FormSenha email={email} />
            : <FormEmail />}
        </div>
        <p style={{ color: "#9fb0cf", fontSize: 13, textAlign: "center", marginTop: 18 }}>
          Treinamento de conscientização em segurança da informação · Broadcast TI
        </p>
      </div>
    </div>
  );
}
