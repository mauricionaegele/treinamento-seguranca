"use client";

import { useEffect, useState } from "react";
import { enviarEmails } from "../../acoes";

// As caixinhas ficam nas linhas da tabela, ligadas a este formulário pelo
// atributo form="form-emails" (a tabela já tem outros formulários dentro).
const SELETOR = 'input[form="form-emails"][name="ids"]';

function caixas() {
  return [...document.querySelectorAll<HTMLInputElement>(SELETOR)];
}

export function BarraEnvio({ clienteId, naoIniciados, andamento }: { clienteId: string; naoIniciados: number; andamento: number }) {
  const [marcados, setMarcados] = useState(0);
  useEffect(() => {
    const conta = () => setMarcados(caixas().filter((c) => c.checked).length);
    document.addEventListener("change", conta);
    conta();
    return () => document.removeEventListener("change", conta);
  }, []);
  const pendentes = naoIniciados + andamento;

  return (
    <form id="form-emails" action={enviarEmails} className="barra-envio">
      <input type="hidden" name="clienteId" value={clienteId} />
      <div>
        <b style={{ display: "block", marginBottom: 2 }}>✉ Enviar e-mail aos colaboradores</b>
        <span className="muted" style={{ fontSize: 14 }}>
          Quem não começou recebe o <b>convite</b>; quem parou no meio, o <b>lembrete</b>. Quem já concluiu não recebe.
        </span>
      </div>
      <div className="acoes-linha">
        <button
          className="btn btn-pri"
          name="modo"
          value="selecionados"
          disabled={marcados === 0}
          onClick={(e) => { if (!confirm(`Enviar e-mail para ${marcados} colaborador(es) selecionado(s)?`)) e.preventDefault(); }}
        >
          Enviar para os selecionados ({marcados})
        </button>
        {pendentes > 0 && (
          <button
            className="btn btn-sec"
            name="modo"
            value="pendentes"
            formNoValidate
            onClick={(e) => { if (!confirm(`Enviar para todos os ${pendentes} pendentes? (${naoIniciados} convite(s) e ${andamento} lembrete(s))`)) e.preventDefault(); }}
          >
            Enviar para todos os {pendentes} pendentes
          </button>
        )}
      </div>
    </form>
  );
}

/** Caixinha do cabeçalho: marca ou desmarca todas as linhas visíveis. */
export function MarcarTodos() {
  return (
    <input
      type="checkbox"
      title="Marcar todos os visíveis"
      aria-label="Marcar todos os visíveis"
      onChange={(e) => {
        for (const c of caixas()) c.checked = e.target.checked;
        document.dispatchEvent(new Event("change"));
      }}
    />
  );
}
