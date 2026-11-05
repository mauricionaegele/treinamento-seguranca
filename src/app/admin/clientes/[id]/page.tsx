import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TopoAdmin, Mensagens } from "@/components/TopoAdmin";
import { exigirAdmin, podeVerCliente } from "@/lib/sessao";
import { situacaoDoCliente, formataData, ROTULO_SITUACAO, type Situacao } from "@/lib/status";
import { prisma } from "@/lib/prisma";
import { MODULOS } from "@/lib/modulos";
import { desativarColaborador, liberarTentativa } from "../../acoes";
import { BarraEnvio, MarcarTodos } from "./EnvioEmails";

type Busca = { setor?: string; situacao?: string; q?: string; msg?: string; erro?: string };

export default async function PainelCliente({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Busca> }) {
  const { admin, colaborador } = await exigirAdmin();
  const { id } = await params;
  if (!podeVerCliente(admin, id)) redirect("/admin");
  const existe = await prisma.cliente.findUnique({ where: { id }, select: { id: true } });
  if (!existe) notFound();

  const busca = await searchParams;
  const { cliente, linhas, resumo } = await situacaoDoCliente(id);
  const ehAdmin = admin.papel === "ADMIN";
  const setores = [...new Set(linhas.map((l) => l.setor).filter(Boolean))].sort();
  const termo = (busca.q ?? "").toLowerCase();
  const filtradas = linhas.filter(
    (l) =>
      (!busca.setor || l.setor === busca.setor) &&
      (!busca.situacao || l.situacao === busca.situacao) &&
      (!termo || l.nome.toLowerCase().includes(termo) || l.email.includes(termo)),
  );

  // resumo por setor
  const porSetor = setores.map((s) => {
    const ls = linhas.filter((l) => l.setor === s);
    const ok = ls.filter((l) => l.situacao === "concluido").length;
    return { setor: s, total: ls.length, ok, pct: Math.round((ok / ls.length) * 100) };
  });

  const corSituacao: Record<Situacao, string> = { concluido: "feito", andamento: "alerta-st", nao_iniciado: "ruim-st" };
  const qsExport = new URLSearchParams({ ...(busca.setor ? { setor: busca.setor } : {}), ...(busca.situacao ? { situacao: busca.situacao } : {}) });

  return (
    <>
      <TopoAdmin admin={admin} colaborador={colaborador} />
      <div className="wrap">
        {ehAdmin && <Link className="voltar" href="/admin">← Clientes</Link>}
        <div className="titulo-pag">
          <div>
            <h1>{cliente.nome}</h1>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Ciclo {cliente.cicloAtual} · prazo {formataData(cliente.prazo)} · {cliente.exigeProvaFinal ? `prova final com nota mínima ${cliente.notaMinima}%` : "sem prova final"}
            </p>
          </div>
          <div className="acoes-linha">
            <a className="btn btn-sec" href={`/admin/clientes/${id}/exportar?${qsExport}`}>⬇ Excel</a>
            <Link className="btn btn-sec" href={`/admin/clientes/${id}/relatorio`}>🖨 Relatório</Link>
            {ehAdmin && <Link className="btn btn-sec" href={`/admin/clientes/${id}/importar`}>👥 Colaboradores</Link>}
            {ehAdmin && <Link className="btn btn-sec" href={`/admin/clientes/${id}/editar`}>⚙ Configurar</Link>}
          </div>
        </div>
        <div style={{ marginTop: 14 }}><Mensagens msg={busca.msg} erro={busca.erro} /></div>

        <div className="stats">
          <div className="stat"><b>{resumo.total}</b><span>colaboradores</span></div>
          <div className="stat"><b style={{ color: "var(--green)" }}>{resumo.concluido}</b><span>concluíram ({resumo.pct}%)</span></div>
          <div className="stat"><b style={{ color: "#b7791f" }}>{resumo.andamento}</b><span>em andamento</span></div>
          <div className="stat"><b style={{ color: "var(--coral)" }}>{resumo.naoIniciado}</b><span>não iniciaram</span></div>
          <div className="stat"><b>{resumo.media ?? "—"}{resumo.media !== null && "%"}</b><span>nota média</span></div>
          <div className="stat"><b>{resumo.vencendo}</b><span>certificados vencendo em 30 dias</span></div>
        </div>

        {resumo.total > resumo.concluido && (
          <BarraEnvio clienteId={id} naoIniciados={resumo.naoIniciado} andamento={resumo.andamento} />
        )}

        {porSetor.length > 1 && (
          <details className="caixa" style={{ marginBottom: 18 }}>
            <summary>Andamento por setor</summary>
            <table className="tabela" style={{ marginTop: 10 }}>
              <thead><tr><th>Setor</th><th>Colaboradores</th><th>Concluíram</th></tr></thead>
              <tbody>
                {porSetor.map((s) => (
                  <tr key={s.setor}><td>{s.setor}</td><td>{s.total}</td><td>{s.ok} ({s.pct}%)</td></tr>
                ))}
              </tbody>
            </table>
          </details>
        )}

        <form className="filtros">
          <label className="campo-form"><span>Buscar</span><input name="q" defaultValue={busca.q} placeholder="Nome ou e-mail" /></label>
          <label className="campo-form">
            <span>Setor</span>
            <select name="setor" defaultValue={busca.setor ?? ""}>
              <option value="">Todos</option>
              {setores.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="campo-form">
            <span>Situação</span>
            <select name="situacao" defaultValue={busca.situacao ?? ""}>
              <option value="">Todas</option>
              {(Object.keys(ROTULO_SITUACAO) as Situacao[]).map((s) => <option key={s} value={s}>{ROTULO_SITUACAO[s]}</option>)}
            </select>
          </label>
          <button className="btn btn-sec">Filtrar</button>
          <span className="muted" style={{ fontSize: 13 }}>{filtradas.length} de {linhas.length}</span>
        </form>

        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr><th className="col-marca"><MarcarTodos /></th><th>Colaborador</th><th>Setor / gestor</th><th>Módulos</th>{cliente.exigeProvaFinal && <th>Prova</th>}<th>Situação</th><th>Concluído em</th><th>Último acesso</th>{ehAdmin && <th></th>}</tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && <tr><td colSpan={9} className="muted">{linhas.length ? "Ninguém com esses filtros." : "Nenhum colaborador cadastrado. Importe a lista em \"Colaboradores\"."}</td></tr>}
              {filtradas.map((l) => (
                <tr key={l.id}>
                  <td className="col-marca">
                    {l.situacao !== "concluido" && (
                      <input type="checkbox" name="ids" value={l.id} form="form-emails" aria-label={`Selecionar ${l.nome}`} />
                    )}
                  </td>
                  <td><b>{l.nome}</b><span className="sub">{l.email}</span></td>
                  <td>{l.setor || "—"}<span className="sub">{l.gerente}</span></td>
                  <td>
                    <div className="pontos-mod" title={l.modulos.map((m, i) => `${i + 1}. ${m.titulo}: ${m.concluido ? `${m.nota}%` : m.iniciado ? "iniciado" : "não iniciado"}`).join("\n")}>
                      {l.modulos.map((m) => <i key={m.id} className={m.concluido ? "ok" : m.iniciado ? "ini" : ""} />)}
                    </div>
                    <span className="sub">{l.modulosConcluidos} de {MODULOS.length}</span>
                  </td>
                  {cliente.exigeProvaFinal && (
                    <td>
                      {l.melhorNotaProva !== null ? `${l.melhorNotaProva}%` : "—"}
                      <span className="sub">{l.tentativasProva}/{cliente.maxTentativas} tentativa(s)</span>
                    </td>
                  )}
                  <td><span className={`st ${corSituacao[l.situacao]}`}>{ROTULO_SITUACAO[l.situacao]}</span></td>
                  <td>
                    {l.certificado ? (
                      <>
                        <a href={`/certificado/${l.certificado.codigo}`} target="_blank">{formataData(l.certificado.emitidoEm)}</a>
                        <span className="sub">nota {l.certificado.nota}% · vale até {formataData(l.certificado.validoAte)}</span>
                      </>
                    ) : "—"}
                  </td>
                  <td>
                    {formataData(l.ultimoAcesso, true)}
                    {l.ultimoEmail && <span className="sub">{l.ultimoEmail.tipo === "convite" ? "convite" : "lembrete"} em {formataData(l.ultimoEmail.em)}</span>}
                  </td>
                  {ehAdmin && (
                    <td style={{ whiteSpace: "nowrap" }}>
                      {cliente.exigeProvaFinal && !l.certificado && l.tentativasProva >= cliente.maxTentativas && (
                        <form action={liberarTentativa} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={l.id} />
                          <button className="btn-link" title="Libera mais uma tentativa da prova">Liberar tentativa</button>
                        </form>
                      )}{" "}
                      <form action={desativarColaborador} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={l.id} />
                        <button className="btn-link" style={{ color: "var(--muted)" }} title="Remove da lista (saiu da empresa)">Desativar</button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
          Módulos: <span className="pontos-mod" style={{ display: "inline-flex", verticalAlign: "middle" }}><i className="ok" /></span> concluído ·{" "}
          <span className="pontos-mod" style={{ display: "inline-flex", verticalAlign: "middle" }}><i className="ini" /></span> iniciado ·{" "}
          <span className="pontos-mod" style={{ display: "inline-flex", verticalAlign: "middle" }}><i /></span> não iniciado. Passe o mouse sobre os quadradinhos para ver as notas.
        </p>
      </div>
    </>
  );
}
