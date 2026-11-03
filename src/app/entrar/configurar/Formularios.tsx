"use client";

import { useActionState } from "react";
import { concluirConfiguracao, configurarAcesso, gerarNovosCodigos, type EstadoConfig } from "./acoes";

function CodigosEmergencia({ codigos }: { codigos: string[] }) {
  return (
    <>
      <h1>Guarde seus códigos de emergência</h1>
      <p className="muted">
        Se você perder o celular, cada código abaixo permite entrar <b>uma vez</b> no lugar do código do aplicativo.
        Guarde num lugar seguro (gerenciador de senhas ou papel). Eles não serão mostrados de novo.
      </p>
      <div className="codigos-emergencia">
        {codigos.map((c) => <code key={c}>{c}</code>)}
      </div>
      <form action={concluirConfiguracao}>
        <button className="btn btn-pri btn-bloco">Já guardei, entrar →</button>
      </form>
    </>
  );
}

export function FormConfigurar({ qr, segredo, email, nome }: { qr: string; segredo: string; email: string; nome: string }) {
  const [estado, acao, enviando] = useActionState<EstadoConfig, FormData>(configurarAcesso, {});
  if (estado.codigos) return <CodigosEmergencia codigos={estado.codigos} />;
  return (
    <form action={acao}>
      <h1>Configure seu acesso</h1>
      <p className="muted">
        Olá, {nome.split(" ")[0]}. A área administrativa usa senha + Google Authenticator. Isso é feito uma vez só; depois você entra com <b>{email}</b>, a senha e o código do aplicativo.
      </p>
      {estado.erro && <div className="erro">{estado.erro}</div>}

      <h2 className="passo-config">1. Escaneie o QR code</h2>
      <p className="muted" style={{ fontSize: 14 }}>
        No celular, abra o <b>Google Authenticator</b> (ou Microsoft Authenticator), toque em <b>+</b> e escolha <b>Ler código QR</b>.
      </p>
      <div className="qr-config">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR code para o aplicativo autenticador" width={200} height={200} />
        <div>
          <small className="muted">Não consegue ler? Escolha &quot;Inserir chave de configuração&quot; e digite:</small>
          <code className="chave-totp">{segredo}</code>
        </div>
      </div>

      <h2 className="passo-config">2. Crie sua senha</h2>
      <div className="grid-form">
        <label className="campo-form">
          <span>Senha (mínimo 10 caracteres)</span>
          <input name="senha" type="password" autoComplete="new-password" minLength={10} required />
        </label>
        <label className="campo-form">
          <span>Repita a senha</span>
          <input name="confirma" type="password" autoComplete="new-password" minLength={10} required />
        </label>
      </div>

      <h2 className="passo-config">3. Confirme com o código do aplicativo</h2>
      <label className="campo-form">
        <span>Código de 6 números que aparece no aplicativo</span>
        <input className="input-codigo" name="codigo" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required placeholder="000000" />
      </label>
      <button className="btn btn-pri btn-bloco" disabled={enviando}>{enviando ? "Conferindo…" : "Concluir configuração →"}</button>
    </form>
  );
}

export function JaConfigurado() {
  const [estado, acao, gerando] = useActionState<EstadoConfig, FormData>(gerarNovosCodigos, {});
  if (estado.codigos) return <CodigosEmergencia codigos={estado.codigos} />;
  return (
    <>
      <h1>Autenticador configurado</h1>
      <p className="muted">Sua senha e o autenticador já estão prontos. Se você não anotou os códigos de emergência, gere outros agora (os anteriores deixam de valer).</p>
      {estado.erro && <div className="erro">{estado.erro}</div>}
      <form action={acao} style={{ marginBottom: 12 }}>
        <button className="btn btn-sec btn-bloco" disabled={gerando}>Gerar novos códigos de emergência</button>
      </form>
      <form action={concluirConfiguracao}>
        <button className="btn btn-pri btn-bloco">Entrar →</button>
      </form>
    </>
  );
}
