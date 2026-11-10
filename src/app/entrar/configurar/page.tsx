import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { LogoMarca } from "@/components/Topo";
import { prisma } from "@/lib/prisma";
import { lerSessao } from "@/lib/sessao";
import { cifrar, decifrar } from "@/lib/seguranca";
import { linkAutenticador, novoSegredoTotp } from "@/lib/totp";
import { FormConfigurar, JaConfigurado } from "./Formularios";

export const metadata = { title: "Configurar acesso · Segurança em Dia" };

export default async function Configurar() {
  const s = await lerSessao();
  if (!s) redirect("/entrar");
  if (!s.adminPendente) redirect(s.admin ? "/admin" : "/");
  const admin = s.adminPendente;

  let conteudo;
  if (admin.totpAtivo) {
    conteudo = <JaConfigurado />;
  } else {
    // o segredo é criado uma vez e guardado cifrado; recarregar a página mostra o mesmo QR
    let segredo = admin.totpSegredo ? decifrar(admin.totpSegredo) : null;
    if (!segredo) {
      segredo = novoSegredoTotp();
      await prisma.usuarioAdmin.update({ where: { id: admin.id }, data: { totpSegredo: cifrar(segredo) } });
    }
    const qr = await QRCode.toDataURL(linkAutenticador(segredo, admin.email), { margin: 1, width: 220 });
    conteudo = <FormConfigurar qr={qr} segredo={segredo.match(/.{1,4}/g)!.join(" ")} email={admin.email} nome={admin.nome} />;
  }

  return (
    <div className="login-fundo">
      <div className="login-caixa" style={{ maxWidth: 560 }}>
        <div className="card"><div className="logo-login"><LogoMarca /></div>{conteudo}</div>
      </div>
    </div>
  );
}
