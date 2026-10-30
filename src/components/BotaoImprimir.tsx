"use client";

export function BotaoImprimir({ texto = "🖨 Imprimir / salvar PDF" }: { texto?: string }) {
  return (
    <button className="btn btn-pri nao-imprimir" onClick={() => window.print()}>
      {texto}
    </button>
  );
}
