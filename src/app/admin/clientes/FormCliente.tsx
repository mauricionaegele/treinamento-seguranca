import { salvarCliente } from "../acoes";

type Cliente = {
  id: string; nome: string; contatoTi: string; cicloAtual: number; prazo: Date | null;
  notaMinima: number; maxTentativas: number; validadeMeses: number; exigeProvaFinal: boolean;
};

export function FormCliente({ cliente }: { cliente?: Cliente }) {
  const ano = new Date().getFullYear();
  return (
    <form action={salvarCliente} className="card">
      {cliente && <input type="hidden" name="id" value={cliente.id} />}
      <label className="campo-form">
        <span>Nome do cliente</span>
        <input name="nome" required defaultValue={cliente?.nome} placeholder="Ex.: Empresa XYZ Ltda." />
      </label>
      <label className="campo-form">
        <span>Contato da TI para incidentes</span>
        <input name="contatoTi" defaultValue={cliente?.contatoTi} placeholder="Ex.: suporte@broadcastti.com.br · (21) 0000-0000" />
        <small>Aparece nos módulos, onde explicamos como avisar a TI.</small>
      </label>
      <div className="grid-form">
        <label className="campo-form">
          <span>Ciclo (ano do treinamento)</span>
          <input name="cicloAtual" type="number" required defaultValue={cliente?.cicloAtual ?? ano} readOnly={!!cliente} />
          {cliente && <small>Para passar ao próximo ano, use &quot;Iniciar novo ciclo&quot; abaixo.</small>}
        </label>
        <label className="campo-form">
          <span>Prazo para concluir</span>
          <input name="prazo" type="date" defaultValue={cliente?.prazo ? cliente.prazo.toISOString().slice(0, 10) : ""} />
        </label>
        <label className="campo-form">
          <span>Nota mínima (%)</span>
          <input name="notaMinima" type="number" min={0} max={100} required defaultValue={cliente?.notaMinima ?? 70} />
        </label>
        <label className="campo-form">
          <span>Tentativas da prova final</span>
          <input name="maxTentativas" type="number" min={1} max={20} required defaultValue={cliente?.maxTentativas ?? 3} />
        </label>
        <label className="campo-form">
          <span>Validade do certificado (meses)</span>
          <input name="validadeMeses" type="number" min={1} max={60} required defaultValue={cliente?.validadeMeses ?? 12} />
        </label>
      </div>
      <label className="alt" style={{ marginBottom: 18 }}>
        <input type="checkbox" name="exigeProvaFinal" defaultChecked={cliente?.exigeProvaFinal ?? true} />
        <span>
          <b>Exigir prova final</b>
          <br /><span className="muted" style={{ fontSize: 14 }}>
            Desmarcado: o certificado é emitido quando a pessoa conclui os 7 módulos, com a média dos quizzes como nota.
          </span>
        </span>
      </label>
      <button className="btn btn-pri">Salvar</button>
    </form>
  );
}
