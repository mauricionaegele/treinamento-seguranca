import "server-only";
import { randomInt } from "node:crypto";
import type { IdModulo } from "./modulos";

// Banco de questões da prova final. A resposta certa (c) nunca vai para o navegador.
export type Questao = { id: string; modulo: IdModulo; q: string; o: string[]; c: number };

export const QUESTOES: Questao[] = [
  // --- Ameaças
  { id: "am1", modulo: "ameacas", q: "Qual ameaça criptografa os arquivos da empresa e pede pagamento para devolvê-los?", o: ["Spyware", "Ransomware", "Adware", "Worm"], c: 1 },
  { id: "am2", modulo: "ameacas", q: "Um programa \"grátis\" pede para você desativar o antivírus durante a instalação. O que isso indica?", o: ["Que é um programa leve", "Forte sinal de trojan: não instale e avise a TI", "Que o antivírus está com defeito", "Que é uma versão profissional"], c: 1 },
  { id: "am3", modulo: "ameacas", q: "Qual é a forma correta de conseguir um programa que você precisa para o trabalho?", o: ["Baixar do primeiro resultado patrocinado", "Baixar de um site de downloads conhecido", "Pedir à TI por chamado", "Usar um ativador gratuito"], c: 2 },
  { id: "am4", modulo: "ameacas", q: "Aparece na tela um alerta com sirene dizendo que seu computador tem vírus e um telefone de suporte. O que fazer?", o: ["Ligar para o número", "Clicar em \"remover vírus\"", "Fechar o navegador e avisar a TI", "Desligar o antivírus"], c: 2 },
  { id: "am5", modulo: "ameacas", q: "Por que é importante salvar os arquivos nas pastas da empresa (rede ou nuvem corporativa)?", o: ["Porque ocupam menos espaço", "Porque ali existe backup e é possível recuperar em caso de ransomware", "Porque abrem mais rápido", "Não faz diferença"], c: 1 },
  // --- Phishing
  { id: "ph1", modulo: "phishing", q: "Qual destes endereços pertence de verdade à empresa \"banco.com.br\"?", o: ["banco.com.br.acesso-seguro.net", "internet.banco.com.br", "banco-com-br.online", "bancco.com.br"], c: 1 },
  { id: "ph2", modulo: "phishing", q: "Um e-mail do \"suporte\" diz que sua conta será bloqueada em 24 horas se você não confirmar sua senha. Qual o principal sinal de golpe?", o: ["O horário do envio", "A urgência e o pedido de senha", "O tamanho do e-mail", "A cor do botão"], c: 1 },
  { id: "ph3", modulo: "phishing", q: "Antes de clicar num link de e-mail, o que você deve fazer?", o: ["Clicar duas vezes para garantir", "Passar o mouse (ou segurar o dedo) para ver o endereço real", "Encaminhar para um colega", "Responder perguntando se é verdade"], c: 1 },
  { id: "ph4", modulo: "phishing", q: "O diretor manda mensagem de um número novo pedindo um Pix urgente e sigiloso. O que fazer?", o: ["Fazer o Pix rapidamente", "Confirmar ligando para o número antigo dele ou pessoalmente", "Pedir um comprovante por mensagem", "Fazer metade do valor"], c: 1 },
  { id: "ph5", modulo: "phishing", q: "Você recebeu um anexo \"Formulario.html\" que não esperava. O que fazer?", o: ["Abrir para ver do que se trata", "Não abrir e avisar a TI", "Salvar na área de trabalho", "Encaminhar para o RH"], c: 1 },
  // --- Senhas
  { id: "se1", modulo: "senhas", q: "Qual destas é a senha mais forte?", o: ["Empresa@2026", "Coruja-Tambor-Neve-Cometa", "Maria1990!", "Qwerty123"], c: 1 },
  { id: "se2", modulo: "senhas", q: "Por que não usar a mesma senha em vários sites?", o: ["Porque o site não aceita", "Porque se um site vazar, todas as contas com aquela senha ficam expostas", "Porque a senha expira mais rápido", "Não há problema"], c: 1 },
  { id: "se3", modulo: "senhas", q: "Seu celular mostra um pedido de aprovação de login que você não fez. O que isso significa?", o: ["Erro do aplicativo", "Que alguém já tem sua senha: negue, troque a senha e avise a TI", "Manutenção da TI", "Que é preciso atualizar o celular"], c: 1 },
  { id: "se4", modulo: "senhas", q: "Alguém que diz ser da TI liga pedindo o código que chegou no seu celular. Você:", o: ["Passa o código", "Passa só os primeiros números", "Não passa e liga para a TI pelo canal oficial", "Passa e troca a senha depois"], c: 2 },
  { id: "se5", modulo: "senhas", q: "Qual é o melhor lugar para guardar suas senhas?", o: ["Post-it no monitor", "Planilha no computador", "Gerenciador de senhas aprovado pela TI", "Bloco de notas do celular"], c: 2 },
  // --- Engenharia social
  { id: "es1", modulo: "engenharia", q: "Um fornecedor liga avisando que mudou de conta bancária. Qual a atitude correta?", o: ["Atualizar os dados na hora", "Pedir os dados por e-mail", "Confirmar ligando para o contato que a empresa já tinha cadastrado", "Pagar na conta antiga e na nova"], c: 2 },
  { id: "es2", modulo: "engenharia", q: "Alguém sem crachá pede para passar junto com você na catraca. O que fazer?", o: ["Deixar passar por educação", "Pedir que use o próprio crachá ou procure a recepção", "Passar seu crachá duas vezes", "Ignorar"], c: 1 },
  { id: "es3", modulo: "engenharia", q: "Qual publicação em rede social é a MAIS arriscada?", o: ["Foto de uma paisagem", "Foto mostrando seu crachá da empresa", "Receita de bolo", "Foto do almoço"], c: 1 },
  { id: "es4", modulo: "engenharia", q: "\"É urgente e não comente com ninguém.\" O que essa combinação indica?", o: ["Assunto da diretoria", "Dois gatilhos clássicos de golpe: confirme antes", "Prioridade máxima", "Nada de especial"], c: 1 },
  { id: "es5", modulo: "engenharia", q: "Ao sair da sua mesa, mesmo que por pouco tempo, você deve:", o: ["Deixar o computador como está", "Bloquear a tela (Windows + L)", "Desligar o monitor", "Fechar só o e-mail"], c: 1 },
  // --- LGPD
  { id: "lg1", modulo: "lgpd", q: "Qual destes é um dado pessoal sensível?", o: ["Nome", "Telefone", "Informação de saúde", "Cargo"], c: 2 },
  { id: "lg2", modulo: "lgpd", q: "Para enviar um e-mail a 50 clientes ao mesmo tempo, você coloca os endereços em:", o: ["Para", "Cc", "Cco (cópia oculta)", "No corpo do e-mail"], c: 2 },
  { id: "lg3", modulo: "lgpd", q: "O princípio da necessidade da LGPD diz que devemos:", o: ["Coletar o máximo de dados possível", "Usar e compartilhar só os dados realmente necessários", "Guardar os dados para sempre", "Pedir autorização do chefe"], c: 1 },
  { id: "lg4", modulo: "lgpd", q: "Você enviou uma planilha com dados de clientes para a pessoa errada. O que fazer?", o: ["Nada", "Pedir para a pessoa apagar e não contar a ninguém", "Avisar imediatamente o gestor e a TI", "Esperar alguém reclamar"], c: 2 },
  { id: "lg5", modulo: "lgpd", q: "É permitido mandar arquivos com dados de clientes para o seu e-mail pessoal para trabalhar em casa?", o: ["Sim, se for rápido", "Sim, se o e-mail tiver senha forte", "Não: use apenas as ferramentas da empresa", "Sim, se apagar depois"], c: 2 },
  // --- Dispositivos
  { id: "di1", modulo: "dispositivos", q: "Qual a forma mais segura de usar internet num aeroporto?", o: ["Wi-Fi gratuito do aeroporto", "A rede com sinal mais forte", "O roteador do próprio celular, de preferência com a VPN da empresa", "Rede com nome de companhia aérea"], c: 2 },
  { id: "di2", modulo: "dispositivos", q: "Para que serve a VPN da empresa?", o: ["Deixar a internet mais rápida", "Criar um túnel protegido entre você e a empresa em redes não confiáveis", "Bloquear propagandas", "Economizar bateria"], c: 1 },
  { id: "di3", modulo: "dispositivos", q: "Seu celular com o e-mail da empresa foi roubado. Qual a primeira atitude?", o: ["Comprar outro", "Avisar a TI imediatamente", "Esperar o boletim de ocorrência", "Mudar a senha do Wi-Fi de casa"], c: 1 },
  { id: "di4", modulo: "dispositivos", q: "Seu filho pede o notebook da empresa para jogar. Você:", o: ["Empresta se ficar do lado", "Não empresta: o equipamento é de uso exclusivo seu e profissional", "Cria um usuário para ele", "Empresta só no fim de semana"], c: 1 },
  { id: "di5", modulo: "dispositivos", q: "Você achou um pendrive no estacionamento da empresa. O que fazer?", o: ["Conectar para ver de quem é", "Entregar à TI sem conectar", "Formatar e usar", "Conectar no computador de casa"], c: 1 },
  // --- Incidentes
  { id: "in1", modulo: "incidentes", q: "Você suspeita que abriu um arquivo com vírus. O que fazer primeiro?", o: ["Desligar da tomada", "Parar de usar, desconectar da rede e avisar a TI", "Baixar vários antivírus", "Esperar o fim do dia"], c: 1 },
  { id: "in2", modulo: "incidentes", q: "Por que não avisar sobre um problema na sua conta de e-mail usando apenas o próprio e-mail?", o: ["Porque é lento", "Porque o invasor pode estar lendo e apagar o aviso", "Porque a TI não lê e-mail", "Não há problema"], c: 1 },
  { id: "in3", modulo: "incidentes", q: "Você caiu num golpe ontem e só percebeu hoje. O que fazer?", o: ["Não contar, já passou", "Avisar a TI agora mesmo", "Esperar uma semana", "Resolver em segredo"], c: 1 },
  { id: "in4", modulo: "incidentes", q: "Qual destas situações é um incidente que deve ser avisado à TI?", o: ["Esqueci minha senha", "Perdi meu crachá da empresa", "Acabou o papel da impressora", "Quero instalar uma impressora nova"], c: 1 },
  { id: "in5", modulo: "incidentes", q: "O que acontece com quem avisa a TI depois de cometer um erro?", o: ["É punido", "Ajuda a proteger a empresa e os colegas", "Perde o acesso para sempre", "Refaz o curso inteiro"], c: 1 },
];

export const QUESTOES_POR_PROVA = 15;

function embaralha<T>(lista: T[]) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Sorteia 2 questões de cada módulo + 1 extra, com a ordem das opções embaralhada. */
export function sortearProva() {
  const porModulo = new Map<string, Questao[]>();
  for (const q of QUESTOES) porModulo.set(q.modulo, [...(porModulo.get(q.modulo) ?? []), q]);
  const escolhidas: Questao[] = [];
  for (const lista of porModulo.values()) escolhidas.push(...embaralha(lista).slice(0, 2));
  const resto = embaralha(QUESTOES.filter((q) => !escolhidas.includes(q)));
  escolhidas.push(...resto.slice(0, QUESTOES_POR_PROVA - escolhidas.length));
  return embaralha(escolhidas).map((q) => ({ id: q.id, ordem: embaralha(q.o.map((_, i) => i)) }));
}

export function questaoPorId(id: string) {
  return QUESTOES.find((q) => q.id === id);
}
