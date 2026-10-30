import Link from "next/link";
import { Topo } from "@/components/Topo";
import { prisma } from "@/lib/prisma";
import { MODULOS, NOTA_MODULO } from "@/lib/modulos";
import { exigirColaborador } from "@/lib/sessao";
import { formataData } from "@/lib/status";

export default async function Inicio() {
  const { colaborador, admin } = await exigirColaborador();
  const cliente = colaborador.cliente;
  const ciclo = cliente.cicloAtual;

  const [progresso, certificado, tentativas] = await Promise.all([
    prisma.progressoModulo.findMany({ where: { colaboradorId: colaborador.id, ciclo } }),
    prisma.certificado.findUnique({ where: { colaboradorId_ciclo: { colaboradorId: colaborador.id, ciclo } } }),
    prisma.tentativaProva.count({ where: { colaboradorId: colaborador.id, ciclo, finalizadaEm: { not: null } } }),
  ]);

  const mods = MODULOS.map((m) => {
    const p = progresso.find((x) => x.modulo === m.id);
    return { ...m, p, ok: !!p && (p.melhorNota ?? 0) >= NOTA_MODULO };
  });
  const feitos = mods.filter((m) => m.ok).length;
  const todosFeitos = feitos === MODULOS.length;
  const etapas = MODULOS.length + (cliente.exigeProvaFinal ? 1 : 0);
  const pct = certificado ? 100 : Math.round((feitos / etapas) * 100);
  const restamTentativas = cliente.maxTentativas - tentativas;
  const primeiroNome = colaborador.nome.split(" ")[0];

  return (
    <>
      <Topo quem={colaborador.nome} links={admin ? [{ href: "/admin", texto: "Área do gestor" }] : []} />
      <div className="wrap">
        <div className="hero">
          <div>
            <span className="eyebrow" style={{ background: "rgba(255,255,255,.12)", color: "#7ff0dd" }}>
              Treinamento anual {ciclo} · {cliente.nome}
            </span>
            <h1>Olá, {primeiroNome}! Vamos proteger a empresa juntos?</h1>
            <p>
              São {MODULOS.length} módulos curtos, com vídeos e atividades práticas{cliente.exigeProvaFinal ? ", e uma prova final" : ""}. Você pode parar e continuar quando quiser: seu progresso fica salvo.
              {cliente.prazo && <> Conclua até <b style={{ color: "#fff" }}>{formataData(cliente.prazo)}</b>.</>}
            </p>
          </div>
          <div className="anel">
            <svg width="150" height="150" viewBox="0 0 150 150">
              <circle cx="75" cy="75" r="64" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="12" />
              <circle cx="75" cy="75" r="64" fill="none" stroke="#13a89e" strokeWidth="12" strokeLinecap="round" strokeDasharray="402" strokeDashoffset={402 - (402 * pct) / 100} />
            </svg>
            <div><span><b>{pct}%</b>concluído</span></div>
          </div>
        </div>

        <div className="mods">
          {mods.map((m, i) => (
            <a key={m.id} className="mod" href={`/curso/${m.arquivo}`}>
              <div className="n">{m.n}</div>
              <div>
                <p className="rot">Módulo {i + 1} · {m.minutos} min</p>
                <h3>{m.titulo}</h3>
                <p>{m.descricao}</p>
              </div>
              {m.ok ? (
                <span className="st feito">✓ Concluído · {m.p!.melhorNota}%</span>
              ) : m.p ? (
                <span className="st abrir">Continuar →</span>
              ) : (
                <span className="st abrir">Começar →</span>
              )}
            </a>
          ))}
        </div>

        {certificado ? (
          <div className="prova-card feita">
            <div className="n">🏆</div>
            <div>
              <b>Treinamento concluído em {formataData(certificado.emitidoEm)} com nota {certificado.nota}%</b>
              <br /><span className="muted">Certificado válido até {formataData(certificado.validoAte)}.</span>
            </div>
            <Link className="btn btn-pri" href={`/certificado/${certificado.codigo}`}>Ver certificado</Link>
          </div>
        ) : !cliente.exigeProvaFinal ? (
          <div className="prova-card bloq">
            <div className="n">🏆</div>
            <div>
              <b>Certificado</b>
              <br /><span className="muted">É emitido automaticamente quando você concluir os {MODULOS.length} módulos ({feitos} de {MODULOS.length} feitos).</span>
            </div>
          </div>
        ) : todosFeitos ? (
          restamTentativas > 0 ? (
            <div className="prova-card livre">
              <div className="n">📝</div>
              <div>
                <b>Prova final liberada!</b>
                <br /><span className="muted">15 perguntas sobre todo o curso. Nota mínima: {cliente.notaMinima}%. Você tem {restamTentativas} tentativa(s).</span>
              </div>
              <Link className="btn btn-pri" href="/prova">Fazer a prova →</Link>
            </div>
          ) : (
            <div className="prova-card bloq">
              <div className="n">⚠️</div>
              <div>
                <b>Você usou todas as tentativas da prova.</b>
                <br /><span className="muted">Fale com o RH ou a TI da sua empresa para liberar uma nova tentativa.</span>
              </div>
            </div>
          )
        ) : (
          <div className="prova-card bloq">
            <div className="n">🔒</div>
            <div>
              <b>Prova final e certificado</b>
              <br /><span className="muted">Libera quando você concluir os {MODULOS.length} módulos ({feitos} de {MODULOS.length} feitos). Nota mínima: {cliente.notaMinima}%.</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
