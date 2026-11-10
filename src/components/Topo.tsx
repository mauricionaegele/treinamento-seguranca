import Link from "next/link";

export function Escudo({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 28 28" aria-hidden="true">
      <path d="M14 2 4 6v7c0 6.2 4.2 11.3 10 13 5.8-1.7 10-6.8 10-13V6L14 2z" fill="#00a859" />
      <path d="m9.5 14 3.2 3.2 6-6.4" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Logo da Broadcast num selo branco (topo índigo). */
export function SeloMarca({ altura }: { altura?: number }) {
  return (
    <span className="selo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-broadcast.png" alt="Broadcast Soluções em TI" style={altura ? { height: altura } : undefined} />
    </span>
  );
}

/** Logo inteiro (sobre fundo branco: login, certificado). */
export function LogoMarca({ largura = 220 }: { largura?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="logo-marca" src="/logo-broadcast.png" alt="Broadcast Soluções em TI" width={largura} style={{ height: "auto" }} />;
}

export function Topo({
  inicio = "/",
  links = [],
  quem,
}: {
  inicio?: string;
  links?: { href: string; texto: string }[];
  quem?: string;
}) {
  return (
    <header className="topbar nao-imprimir">
      <div className="topbar-inner">
        <Link className="logo" href={inicio}>
          <SeloMarca />
          <span className="nome-curso">Segurança em Dia</span>
        </Link>
        <nav className="menu-topo">
          {quem && <span className="quem">{quem}</span>}
          {links.map((l) => (
            <Link key={l.href} href={l.href}>{l.texto}</Link>
          ))}
          <a href="/sair">Sair</a>
        </nav>
      </div>
    </header>
  );
}
