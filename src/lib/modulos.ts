// Os 7 módulos do curso. O "id" é o que as páginas enviam ao concluir
// (marcaModulo no conteudo/curso.js) e o "arquivo" fica em conteudo/.
export const MODULOS = [
  { id: "ameacas", n: "🦠", titulo: "Conhecendo as ameaças", descricao: "Vírus, trojan, ransomware e cia: como entram e como barrar.", arquivo: "modulo-1-ameacas.html", minutos: 10 },
  { id: "phishing", n: "🎣", titulo: "Phishing: não morda a isca", descricao: "E-mails, SMS e mensagens falsas.", arquivo: "modulo-2-phishing.html", minutos: 10 },
  { id: "senhas", n: "🔑", titulo: "Senhas e verificação em duas etapas", descricao: "Senha forte, gerenciador de senhas e códigos de verificação.", arquivo: "modulo-3-senhas.html", minutos: 8 },
  { id: "engenharia", n: "🎭", titulo: "Engenharia social", descricao: "Golpes por telefone, presenciais e pelas redes sociais.", arquivo: "modulo-4-engenharia.html", minutos: 8 },
  { id: "lgpd", n: "📋", titulo: "LGPD no dia a dia", descricao: "Cuidar dos dados pessoais de clientes e colegas.", arquivo: "modulo-5-lgpd.html", minutos: 8 },
  { id: "dispositivos", n: "💻", titulo: "Celular, notebook e trabalho remoto", descricao: "Wi-Fi público, bloqueio de tela, pendrives e atualizações.", arquivo: "modulo-6-dispositivos.html", minutos: 8 },
  { id: "incidentes", n: "🚨", titulo: "Incidentes: reconhecer e avisar", descricao: "Percebeu algo estranho? O que fazer nos primeiros minutos.", arquivo: "modulo-7-incidentes.html", minutos: 6 },
] as const;

export type IdModulo = (typeof MODULOS)[number]["id"];

// Nota mínima do quiz de cada módulo (a prova final usa a nota do cliente)
export const NOTA_MODULO = 70;

export const IDS_MODULOS = MODULOS.map((m) => m.id) as string[];

export function moduloPorArquivo(arquivo: string) {
  return MODULOS.find((m) => m.arquivo === arquivo);
}
