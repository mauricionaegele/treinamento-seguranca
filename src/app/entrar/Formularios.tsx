"use client";

import { useActionState } from "react";
import { solicitarCodigo, verificarCodigo, verificarSenha, trocarEmail, type EstadoLogin } from "./acoes";

export function FormEmail() {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(solicitarCodigo, {});
  return (
    <form action={acao}>
      <h1>Entrar no treinamento</h1>
      <p className="muted">Digite seu e-mail de trabalho. Vamos enviar um código de acesso para ele.</p>
      {estado.erro && <div className="erro">{estado.erro}</div>}
      <label className="campo-form">
        <span>E-mail</span>
        <input name="email" type="email" autoComplete="email" required autoFocus placeholder="nome@empresa.com.br" />
      </label>
      <button className="btn btn-pri btn-bloco" disabled={enviando}>{enviando ? "Enviando…" : "Receber código →"}</button>
    </form>
  );
}

export function FormCodigo({ email }: { email: string }) {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(verificarCodigo, {});
  return (
    <>
      <form action={acao}>
        <h1>Confira seu e-mail</h1>
        <p className="muted">
          Se <b>{email}</b> estiver cadastrado no treinamento, você vai receber um código de 6 números em instantes. Ele vale por 10 minutos.
        </p>
        {estado.erro && <div className="erro">{estado.erro}</div>}
        <label className="campo-form">
          <span>Código de acesso</span>
          <input className="input-codigo" name="codigo" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required autoFocus placeholder="000000" />
        </label>
        <button className="btn btn-pri btn-bloco" disabled={enviando}>{enviando ? "Conferindo…" : "Entrar →"}</button>
      </form>
      <form action={trocarEmail} style={{ marginTop: 16, textAlign: "center" }}>
        <p className="muted" style={{ fontSize: 13 }}>
          Não chegou? Confira a caixa de spam. Se continuar sem chegar, seu e-mail pode não estar na lista do treinamento: fale com o RH ou a TI da sua empresa.
        </p>
        <button className="btn-link">← Usar outro e-mail ou pedir novo código</button>
      </form>
    </>
  );
}

export function FormSenha({ email }: { email: string }) {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(verificarSenha, {});
  return (
    <>
      <form action={acao}>
        <h1>Acesso administrativo</h1>
        <p className="muted">Entrando como <b>{email}</b>.</p>
        {estado.erro && <div className="erro">{estado.erro}</div>}
        <label className="campo-form">
          <span>Senha</span>
          <input name="senha" type="password" autoComplete="current-password" required autoFocus />
        </label>
        <label className="campo-form">
          <span>Código do Google Authenticator</span>
          <input className="input-codigo" name="codigo" autoComplete="one-time-code" maxLength={9} required placeholder="000000" />
          <small>Perdeu o celular? Digite aqui um dos seus códigos de emergência (ex.: ABCD-EFGH).</small>
        </label>
        <button className="btn btn-pri btn-bloco" disabled={enviando}>{enviando ? "Conferindo…" : "Entrar →"}</button>
      </form>
      <form action={trocarEmail} style={{ marginTop: 16, textAlign: "center" }}>
        <p className="muted" style={{ fontSize: 13 }}>
          Esqueceu a senha ou perdeu o celular e os códigos de emergência? Peça a outro administrador para zerar seu acesso.
        </p>
        <button className="btn-link">← Usar outro e-mail</button>
      </form>
    </>
  );
}
