import Link from "next/link";
import { redirect } from "next/navigation";
import { Topo } from "@/components/Topo";
import { prisma } from "@/lib/prisma";
import { MODULOS } from "@/lib/modulos";
import { questaoPorId } from "@/lib/questoes";
import { exigirColaborador } from "@/lib/sessao";
import { formataData } from "@/lib/status";
import { enviarProva, iniciarProva } from "./acoes";
import { situacaoProva } from "@/lib/prova";

type QuestaoSorteada = { id: string; ordem: number[] };

export default async function Prova({ searchParams }: { searchParams: Promise<{ resultado?: string; erro?: string }> }) {
  const { colaborador } = await exigirColaborador();
  const cliente = colaborador.cliente;
  if (!cliente.exigeProvaFinal) redirect("/");
  const { resultado, erro } = await searchParams;
  const s = await situacaoProva(colaborador.id, cliente);

  const conteudo = await (async () => {
    // --- Resultado de uma tentativa
    if (resultado) {
      const t = await prisma.tentativaProva.findFirst({ where: { id: resultado, colaboradorId: colaborador.id }, include: { certificado: true } });
      if (t?.finalizadaEm) {
        const sorteadas = t.questoes as QuestaoSorteada[];
        const resp = (t.respostas ?? {}) as Record<string, number>;
        const errosPorModulo = new Set(
          sorteadas.map((q) => questaoPorId(q.id)).filter((q) => q && resp[q.id] !== q.c).map((q) => q!.modulo),
        );
        const revisar = MODULOS.filter((m) => errosPorModulo.has(m.id));
        return (
          <div className="fim" style={{ position: "relative" }}>
            <h1>{t.aprovado ? "Parabéns, você foi aprovado!" : "Não foi dessa vez"}</h1>
            <div className="nota">{t.nota}%</div>
            <p>Nota mínima: {cliente.notaMinima}%. Prova feita em {formataData(t.finalizadaEm, true)}.</p>
            {revisar.length > 0 && (
              <p>Vale revisar: <b style={{ color: "#fff" }}>{revisar.map((m) => m.titulo).join(", ")}</b>.</p>
            )}
            <div className="acoes-linha" style={{ justifyContent: "center", marginTop: 22 }}>
              {t.certificado ? (
                <Link className="btn btn-pri" href={`/certificado/${t.certificado.codigo}`}>Ver meu certificado →</Link>
              ) : s.restam > 0 ? (
                <>
                  <Link className="btn btn-sec" href="/">Revisar os módulos</Link>
                  <form action={iniciarProva}><button className="btn btn-pri">Tentar de novo ({s.restam} restante{s.restam > 1 ? "s" : ""})</button></form>
                </>
              ) : (
                <p>Você usou todas as tentativas. Fale com o RH ou a TI da sua empresa.</p>
              )}
            </div>
          </div>
        );
      }
    }

    if (s.certificado) {
      return (
        <div className="card" style={{ textAlign: "center" }}>
          <h2>Você já concluiu o treinamento de {cliente.cicloAtual}</h2>
          <p className="muted">Aprovado com nota {s.certificado.nota}% em {formataData(s.certificado.emitidoEm)}.</p>
          <Link className="btn btn-pri" href={`/certificado/${s.certificado.codigo}`}>Ver certificado</Link>
        </div>
      );
    }
    if (!s.modulosOk) {
      return (
        <div className="card" style={{ textAlign: "center" }}>
          <h2>Conclua os módulos primeiro</h2>
          <p className="muted">A prova final libera quando você concluir os {MODULOS.length} módulos.</p>
          <Link className="btn btn-pri" href="/">Voltar ao curso</Link>
        </div>
      );
    }

    // --- Prova em andamento
    if (s.aberta) {
      const sorteadas = s.aberta.questoes as QuestaoSorteada[];
      return (
        <form action={enviarProva}>
          <div className="titulo-pag"><h1>Prova final</h1><span className="chip-lst">{sorteadas.length} perguntas</span></div>
          <p className="muted">Responda todas as perguntas e clique em &quot;Entregar prova&quot; no final. Nota mínima: {cliente.notaMinima}%.</p>
          {erro === "incompleta" && <div className="erro">Responda todas as perguntas antes de entregar.</div>}
          {sorteadas.map((qs, i) => {
            const q = questaoPorId(qs.id)!;
            return (
              <fieldset key={qs.id} className="questao" style={{ border: "1px solid var(--line)" }}>
                <div className="num">Pergunta {i + 1} de {sorteadas.length}</div>
                <h3>{q.q}</h3>
                {qs.ordem.map((orig, pos) => (
                  <label key={pos} className="alt">
                    <input type="radio" name={`q_${qs.id}`} value={pos} required />
                    <span>{q.o[orig]}</span>
                  </label>
                ))}
              </fieldset>
            );
          })}
          <div className="barra-prova">
            <span className="muted" style={{ fontSize: 14 }}>Confira suas respostas antes de entregar. Depois de entregue, não dá para alterar.</span>
            <button className="btn btn-pri">Entregar prova →</button>
          </div>
        </form>
      );
    }

    if (s.restam <= 0) {
      return (
        <div className="card" style={{ textAlign: "center" }}>
          <h2>Tentativas esgotadas</h2>
          <p className="muted">Você usou as {cliente.maxTentativas} tentativas da prova. Fale com o RH ou a TI da sua empresa para liberar uma nova tentativa.</p>
        </div>
      );
    }

    // --- Antes de começar
    return (
      <div className="card">
        <span className="eyebrow">Prova final · {cliente.cicloAtual}</span>
        <h1>Hora de mostrar o que aprendeu</h1>
        <ul style={{ lineHeight: 1.9 }}>
          <li>15 perguntas sorteadas sobre os {MODULOS.length} módulos.</li>
          <li>Nota mínima para aprovação: <b>{cliente.notaMinima}%</b>.</li>
          <li>Você tem <b>{s.restam}</b> tentativa{s.restam > 1 ? "s" : ""}. Sem limite de tempo.</li>
          <li>Ao ser aprovado, você recebe um certificado com código de verificação.</li>
        </ul>
        <form action={iniciarProva}><button className="btn btn-pri">Começar a prova →</button></form>
      </div>
    );
  })();

  return (
    <>
      <Topo quem={colaborador.nome} links={[{ href: "/", texto: "Voltar ao curso" }]} />
      <div className="wrap" style={{ maxWidth: 820 }}>{conteudo}</div>
    </>
  );
}
