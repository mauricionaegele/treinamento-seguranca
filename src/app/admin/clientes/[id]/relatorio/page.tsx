import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LogoMarca } from "@/components/Topo";
import { BotaoImprimir } from "@/components/BotaoImprimir";
import { prisma } from "@/lib/prisma";
import { exigirAdmin, podeVerCliente } from "@/lib/sessao";
import { situacaoDoCliente, formataData, ROTULO_SITUACAO } from "@/lib/status";
import { MODULOS } from "@/lib/modulos";

// Relatório para apresentar aos gestores do cliente (imprimir ou salvar em PDF).
export default async function Relatorio({ params }: { params: Promise<{ id: string }> }) {
  const { admin } = await exigirAdmin();
  const { id } = await params;
  if (!podeVerCliente(admin, id)) redirect("/admin");
  if (!(await prisma.cliente.findUnique({ where: { id }, select: { id: true } }))) notFound();
  const { cliente, linhas, resumo } = await situacaoDoCliente(id);

  const setores = [...new Set(linhas.map((l) => l.setor || "Sem setor"))].sort();
  const porSetor = setores.map((s) => {
    const ls = linhas.filter((l) => (l.setor || "Sem setor") === s);
    const ok = ls.filter((l) => l.situacao === "concluido").length;
    return { setor: s, total: ls.length, ok, pct: Math.round((ok / ls.length) * 100) };
  });

  return (
    <div className="wrap">
      <style>{`@media print{@page{size:A4;margin:14mm}.tabela{font-size:11px}.tabela td,.tabela th{padding:6px 8px}.quebra{break-before:page}}`}</style>
      <div className="acoes-linha nao-imprimir" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <Link href={`/admin/clientes/${id}`}>← Voltar ao painel</Link>
        <BotaoImprimir />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, borderBottom: "3px solid var(--teal)", paddingBottom: 14 }}>
        <div>
          <LogoMarca largura={190} />
          <h1 style={{ margin: "10px 0 4px", fontSize: 26 }}>Relatório do treinamento de segurança da informação</h1>
          <div className="muted">{cliente.nome} · ciclo {cliente.cicloAtual}</div>
        </div>
        <div className="muted" style={{ textAlign: "right", fontSize: 13 }}>
          Gerado em {formataData(new Date(), true)}<br />
          Prazo: {formataData(cliente.prazo)}<br />
          {cliente.exigeProvaFinal ? `Prova final · nota mínima ${cliente.notaMinima}%` : "Sem prova final"}
        </div>
      </div>

      <div className="stats">
        <div className="stat"><b>{resumo.total}</b><span>colaboradores</span></div>
        <div className="stat"><b style={{ color: "var(--green)" }}>{resumo.pct}%</b><span>concluíram ({resumo.concluido})</span></div>
        <div className="stat"><b>{resumo.andamento}</b><span>em andamento</span></div>
        <div className="stat"><b>{resumo.naoIniciado}</b><span>não iniciaram</span></div>
        <div className="stat"><b>{resumo.media ?? "—"}{resumo.media !== null && "%"}</b><span>nota média</span></div>
      </div>

      <h2 style={{ fontSize: 18 }}>Por setor</h2>
      <div className="tabela-wrap" style={{ marginBottom: 22 }}>
        <table className="tabela">
          <thead><tr><th>Setor</th><th>Colaboradores</th><th>Concluíram</th><th>%</th></tr></thead>
          <tbody>{porSetor.map((s) => <tr key={s.setor}><td>{s.setor}</td><td>{s.total}</td><td>{s.ok}</td><td>{s.pct}%</td></tr>)}</tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 18 }} className="quebra">Situação individual</h2>
      <div className="tabela-wrap">
        <table className="tabela">
          <thead><tr><th>Colaborador</th><th>Setor</th><th>Gestor</th><th>Módulos</th><th>Situação</th><th>Nota</th><th>Concluído em</th><th>Válido até</th></tr></thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id}>
                <td>{l.nome}<span className="sub">{l.email}</span></td>
                <td>{l.setor || "—"}</td>
                <td>{l.gerente || "—"}</td>
                <td>{l.modulosConcluidos}/{MODULOS.length}</td>
                <td>{ROTULO_SITUACAO[l.situacao]}</td>
                <td>{l.certificado ? `${l.certificado.nota}%` : l.melhorNotaProva !== null ? `${l.melhorNotaProva}%*` : "—"}</td>
                <td>{formataData(l.certificado?.emitidoEm)}</td>
                <td>{formataData(l.certificado?.validoAte)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
        * melhor nota em tentativa ainda não aprovada. Cada certificado tem um código de verificação que pode ser conferido publicamente.
        Evidências registradas pelo sistema: data e hora de cada acesso, módulo iniciado e concluído, e de cada tentativa da prova.
      </p>
    </div>
  );
}
