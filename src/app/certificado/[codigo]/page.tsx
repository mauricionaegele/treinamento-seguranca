import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    <div style={{ background: "#ecedf8", minHeight: "100vh", padding: "28px 16px" }}>
      <style>{`
        .cert{max-width:960px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:var(--shadow);position:relative;overflow:hidden;aspect-ratio:1.414/1;display:flex;flex-direction:column;align-items:center;padding:clamp(28px,5.5vw,58px) clamp(28px,7vw,80px);text-align:center}
        .cert::before{content:"";position:absolute;inset:18px 18px 18px 30px;border:3px solid var(--navy2);border-radius:4px;pointer-events:none}
        .cert::after{content:"";position:absolute;inset:25px 25px 25px 37px;border:1px solid var(--teal);pointer-events:none}
        .cert .faixa{position:absolute;left:0;top:0;bottom:0;width:14px;background:linear-gradient(var(--teal) 0 50%,var(--navy2) 50% 100%)}
        .cert .logo-cert{width:clamp(150px,26vw,250px);height:auto;margin-bottom:clamp(8px,2vw,18px)}
        .cert .tit{font-family:Georgia,"Times New Roman",serif;font-weight:700;font-size:clamp(26px,4.4vw,44px);color:var(--navy);margin:0;letter-spacing:.02em}
        .cert .sub{font-size:clamp(10px,1.4vw,13px);letter-spacing:.3em;color:#00874a;font-weight:700;margin:4px 0 clamp(10px,2.4vw,22px)}
        .cert .nome{font-size:clamp(24px,4.2vw,40px);font-weight:800;color:var(--ink);margin:6px 0 8px;border-bottom:2px solid var(--line);display:inline-block;padding:0 36px 8px}
        .cert p{color:#3b4458;max-width:660px;margin:0 auto 8px}
        .cert .conteudo-mod{font-size:13px;color:var(--muted)}
        .cert .rodape{margin-top:auto;width:100%;display:flex;justify-content:space-between;align-items:flex-end;gap:16px;font-size:12px;color:var(--muted);text-align:left;position:relative;z-index:1}
        .cert .rodape b{color:var(--navy);display:block;font-size:13px}
        .cert .selo-ok{flex:none;width:clamp(64px,9vw,88px);height:clamp(64px,9vw,88px);border-radius:50%;background:var(--teal);color:#fff;display:grid;place-items:center;font-weight:800;font-size:clamp(10px,1.3vw,12px);line-height:1.25;text-align:center;box-shadow:0 0 0 6px var(--teal-soft)}
        @media (max-width:640px){.cert{aspect-ratio:auto}.cert .rodape{flex-wrap:wrap}}
        @media print{@page{size:A4 landscape;margin:0}body{background:#fff}.cert{box-shadow:none;border-radius:0;max-width:none;width:100vw;height:100vh;aspect-ratio:auto}}
      `}</style>
      <div className="acoes-linha nao-imprimir" style={{ maxWidth: 960, margin: "0 auto 14px", justifyContent: "space-between" }}>
        <span className={vencido ? "st ruim-st" : "st feito"}>
          {vencido ? `✗ Certificado vencido em ${formataData(cert.validoAte)}` : `✓ Certificado autêntico · válido até ${formataData(cert.validoAte)}`}
        </span>
        <BotaoImprimir />
      </div>
      <div className="cert">
        <div className="faixa" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo-cert" src="/logo-broadcast.png" alt="Broadcast Soluções em TI" />
        <p className="tit">Certificado</p>
        <p className="sub">DE CONCLUSÃO</p>
        <p>Certificamos que</p>
        <div><span className="nome">{cert.colaborador.nome}</span></div>
        <p>
          colaborador(a) de <b>{cert.colaborador.cliente.nome}</b>, concluiu o <b>Treinamento de Conscientização em Segurança da Informação</b> (ciclo {cert.ciclo}),
          com carga horária de {horas} hora{horas > 1 ? "s" : ""} e {cert.colaborador.cliente.exigeProvaFinal ? "aprovação na avaliação final" : "média nas atividades dos módulos"} com nota <b>{cert.nota}%</b>.
        </p>
        <p className="conteudo-mod">Conteúdo: {MODULOS.map((m) => m.titulo.split(":")[0]).join(" · ")}</p>
        <div className="rodape">
          <div><b>Emitido em {formataData(cert.emitidoEm)}</b>Válido até {formataData(cert.validoAte)}</div>
          <div className="selo-ok">APROVADO<br />{cert.nota}%</div>
          <div style={{ textAlign: "right" }}>
            <b>Código: {cert.codigo}</b>
            Verifique em {URL_BASE.replace(/^https?:\/\//, "")}/certificado/{cert.codigo}
            <br />Treinamento oferecido por Broadcast TI
          </div>
        </div>
      </div>
    </div>
  );
}
