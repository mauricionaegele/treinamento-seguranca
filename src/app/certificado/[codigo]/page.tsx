import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Escudo } from "@/components/Topo";
import { prisma } from "@/lib/prisma";
import { MODULOS } from "@/lib/modulos";
import { formataData } from "@/lib/status";
import { URL_BASE } from "@/lib/email";
import { BotaoImprimir } from "@/components/BotaoImprimir";

export const metadata: Metadata = { title: "Certificado · Segurança em Dia" };

// Página pública: qualquer pessoa com o código consegue conferir se o certificado é autêntico.
export default async function Certificado({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const cert = await prisma.certificado.findUnique({
    where: { codigo: codigo.toUpperCase() },
    include: { colaborador: { include: { cliente: true } } },
  });
  if (!cert) notFound();

  const vencido = cert.validoAte < new Date();
  const horas = Math.round(MODULOS.reduce((t, m) => t + m.minutos, 0) / 60) || 1;

  return (
    <div style={{ background: "#e9edf5", minHeight: "100vh", padding: "28px 16px" }}>
      <style>{`
        .cert{max-width:960px;margin:0 auto;background:#fff;border-radius:18px;box-shadow:var(--shadow);position:relative;overflow:hidden;aspect-ratio:1.414/1;display:flex;flex-direction:column;justify-content:center;padding:clamp(24px,6vw,64px);text-align:center}
        .cert::before{content:"";position:absolute;inset:14px;border:3px solid var(--teal);border-radius:12px;pointer-events:none}
        .cert::after{content:"";position:absolute;inset:22px;border:1px solid #cfe9e6;border-radius:8px;pointer-events:none}
        .cert h1{font-size:clamp(22px,4vw,40px);letter-spacing:.04em;margin:10px 0 4px}
        .cert .nome{font-size:clamp(24px,4.6vw,44px);font-weight:800;color:var(--navy);margin:14px 0;border-bottom:2px solid var(--line);display:inline-block;padding:0 24px 8px}
        .cert p{color:#3b4458;max-width:640px;margin:0 auto 10px}
        .cert .rodape{display:flex;justify-content:space-between;gap:16px;margin-top:clamp(16px,4vw,40px);font-size:13px;color:var(--muted);flex-wrap:wrap;text-align:left}
        .cert .rodape b{color:var(--navy);display:block;font-size:14px}
        @media (max-width:640px){.cert{aspect-ratio:auto}}
        @media print{@page{size:A4 landscape;margin:0}body{background:#fff}.cert{box-shadow:none;border-radius:0;max-width:none;width:100vw;height:100vh;aspect-ratio:auto}}
      `}</style>
      <div className="acoes-linha nao-imprimir" style={{ maxWidth: 960, margin: "0 auto 14px", justifyContent: "space-between" }}>
        <span className={vencido ? "st ruim-st" : "st feito"}>
          {vencido ? `✗ Certificado vencido em ${formataData(cert.validoAte)}` : `✓ Certificado autêntico · válido até ${formataData(cert.validoAte)}`}
        </span>
        <BotaoImprimir />
      </div>
      <div className="cert">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, fontWeight: 800, color: "var(--navy)" }}>
          <Escudo tamanho={34} /> Segurança em Dia
        </div>
        <h1>CERTIFICADO DE CONCLUSÃO</h1>
        <p>Certificamos que</p>
        <div><span className="nome">{cert.colaborador.nome}</span></div>
        <p>
          colaborador(a) de <b>{cert.colaborador.cliente.nome}</b>, concluiu o <b>Treinamento de Conscientização em Segurança da Informação</b> (ciclo {cert.ciclo}),
          com carga horária de {horas} hora{horas > 1 ? "s" : ""} e aprovação na avaliação final com nota <b>{cert.nota}%</b>.
        </p>
        <p className="muted" style={{ fontSize: 14 }}>
          Conteúdo: {MODULOS.map((m) => m.titulo.split(":")[0]).join(" · ")}
        </p>
        <div className="rodape">
          <div><b>Emitido em</b>{formataData(cert.emitidoEm)}</div>
          <div><b>Válido até</b>{formataData(cert.validoAte)}</div>
          <div><b>Código de verificação</b>{cert.codigo}</div>
          <div><b>Verifique em</b>{URL_BASE.replace(/^https?:\/\//, "")}/certificado/{cert.codigo}</div>
        </div>
      </div>
    </div>
  );
}
