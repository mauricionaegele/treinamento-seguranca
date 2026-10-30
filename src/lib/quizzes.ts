import "server-only";
import type { IdModulo } from "./modulos";

// Quizzes dos módulos. Ficam só no servidor: a página recebe a pergunta e as
// opções, e cada resposta é conferida aqui (c = índice da opção certa).
export type PerguntaQuiz = { q: string; o: string[]; c: number; e: string };

export const QUIZZES: Record<IdModulo, PerguntaQuiz[]> = {
  "ameacas": [
    {
      "q": "O que é malware?",
      "o": [
        "Um tipo de antivírus",
        "Qualquer programa feito para causar dano, como vírus, trojan e ransomware",
        "Um defeito no computador",
        "Um e-mail de propaganda"
      ],
      "c": 1,
      "e": "Malware é o nome geral; vírus, trojan, ransomware e spyware são tipos de malware."
    },
    {
      "q": "Um programa \"grátis\" pede para desligar o antivírus durante a instalação. O que isso indica?",
      "o": [
        "É normal, antivírus dá falso positivo",
        "Que o programa é muito bom",
        "Forte sinal de trojan: não instale e avise a TI",
        "Que o antivírus está desatualizado"
      ],
      "c": 2,
      "e": "Pedir para desligar a proteção é a marca registrada de crack e trojan."
    },
    {
      "q": "Qual ameaça tranca os arquivos e pede pagamento para devolvê-los?",
      "o": [
        "Adware",
        "Ransomware",
        "Worm",
        "Spyware"
      ],
      "c": 1,
      "e": "Ransomware = sequestro de dados. É o que mais causa prejuízo às empresas hoje."
    },
    {
      "q": "Você encontra um pendrive no estacionamento da empresa. O que faz?",
      "o": [
        "Conecta para descobrir de quem é",
        "Entrega para a TI sem conectar",
        "Formata e usa",
        "Conecta no computador de casa, que é mais seguro"
      ],
      "c": 1,
      "e": "Pendrives \"perdidos\" são uma isca clássica. Entregue à TI."
    },
    {
      "q": "Qual hábito mais protege os arquivos da empresa contra ransomware?",
      "o": [
        "Salvar tudo na área de trabalho",
        "Guardar arquivos nas pastas da rede ou na nuvem da empresa, que têm backup",
        "Desligar as atualizações automáticas",
        "Usar o mesmo computador em casa"
      ],
      "c": 1,
      "e": "Com backup, a empresa recupera os arquivos sem pagar resgate."
    }
  ],
  "phishing": [
    {
      "q": "Você recebe um e-mail do \"suporte\" pedindo sua senha para evitar o bloqueio da conta. O que fazer?",
      "o": [
        "Responder com a senha, já que é do suporte",
        "Clicar no link e trocar a senha por lá",
        "Não responder e avisar a TI pelo canal oficial",
        "Encaminhar para os colegas perguntando se é verdade"
      ],
      "c": 2,
      "e": "Nenhuma TI pede senha. Avise pelo canal oficial e não encaminhe para colegas."
    },
    {
      "q": "Qual destes endereços pertence de verdade à empresa \"fornecedor.com.br\"?",
      "o": [
        "fornecedor.com.br.pagamentos.net",
        "portal.fornecedor.com.br",
        "fornecedor-com-br.site",
        "fornecedorr.com.br"
      ],
      "c": 1,
      "e": "O domínio é o que vem logo antes da primeira barra. \"portal.\" é só um subdomínio de fornecedor.com.br."
    },
    {
      "q": "O diretor manda uma mensagem de um número novo pedindo um Pix urgente e sigiloso. Qual a atitude certa?",
      "o": [
        "Fazer o Pix, porque é o diretor",
        "Ligar para o número antigo dele ou confirmar pessoalmente",
        "Pedir o comprovante da reunião",
        "Fazer só metade do valor"
      ],
      "c": 1,
      "e": "Confirme sempre por outro canal que você já conhece. Urgência e sigilo são sinais clássicos de golpe."
    },
    {
      "q": "Você clicou num link suspeito e digitou sua senha. Qual a primeira coisa a fazer?",
      "o": [
        "Apagar o e-mail e esquecer",
        "Esperar para ver se acontece algo",
        "Avisar a TI imediatamente e trocar a senha",
        "Desligar o computador e ir embora"
      ],
      "c": 2,
      "e": "Velocidade é tudo. Avisar rápido permite bloquear o acesso do golpista antes do prejuízo."
    },
    {
      "q": "Qual destes NÃO é, por si só, um sinal de phishing?",
      "o": [
        "Pressão para agir em poucas horas",
        "Remetente com domínio diferente do oficial",
        "Mensagem que te chama pelo nome e não pede nada",
        "Anexo .html que você não esperava"
      ],
      "c": 2,
      "e": "Uma mensagem pessoal, de um domínio conhecido e sem pedidos é o normal. Os outros três são sinais clássicos."
    }
  ],
  "senhas": [
    {
      "q": "Qual destas senhas é a mais forte?",
      "o": [
        "Empresa@2026",
        "P@ssw0rd!",
        "Coruja-Tambor-Neve-Cometa",
        "Maria1990"
      ],
      "c": 2,
      "e": "Quatro palavras aleatórias formam uma senha longa e imprevisível. As outras seguem padrões que estão em listas."
    },
    {
      "q": "Por que não se deve usar a mesma senha em vários lugares?",
      "o": [
        "Porque o sistema não deixa",
        "Porque se um site vazar, todas as contas com aquela senha ficam expostas",
        "Porque a senha \"gasta\" com o uso",
        "Não há problema se a senha for forte"
      ],
      "c": 1,
      "e": "Vazamentos acontecem o tempo todo, e os criminosos testam a senha vazada em outros sites."
    },
    {
      "q": "Seu celular mostra um pedido de aprovação de login que você não fez. O que isso significa?",
      "o": [
        "Um erro do aplicativo",
        "Que alguém já tem sua senha e está tentando entrar",
        "Que a TI está fazendo manutenção",
        "Que precisa atualizar o celular"
      ],
      "c": 1,
      "e": "O pedido só aparece depois que a senha foi digitada corretamente. Negue, troque a senha e avise a TI."
    },
    {
      "q": "Alguém da \"TI\" liga pedindo o código que chegou no seu celular. O que fazer?",
      "o": [
        "Passar, porque é da TI",
        "Passar só se ele souber seu nome",
        "Não passar e ligar para a TI pelo número oficial",
        "Passar e trocar a senha depois"
      ],
      "c": 2,
      "e": "Código de verificação não se passa para ninguém, nunca."
    },
    {
      "q": "Qual o melhor lugar para guardar suas senhas?",
      "o": [
        "Planilha no computador",
        "Post-it no monitor",
        "Gerenciador de senhas aprovado pela TI",
        "Bloco de notas do celular"
      ],
      "c": 2,
      "e": "O gerenciador guarda tudo criptografado e ainda ajuda a evitar páginas falsas."
    }
  ],
  "engenharia": [
    {
      "q": "O que é engenharia social?",
      "o": [
        "Um curso de engenharia",
        "Manipular pessoas para que entreguem informações, acessos ou dinheiro",
        "Um tipo de antivírus",
        "Uma rede social corporativa"
      ],
      "c": 1,
      "e": "O alvo é a pessoa, não o computador."
    },
    {
      "q": "Um \"fornecedor\" liga avisando que mudou de conta bancária. Qual a atitude certa?",
      "o": [
        "Anotar os novos dados",
        "Pedir que mande por e-mail",
        "Confirmar ligando para o contato que a empresa já tinha cadastrado",
        "Pagar metade em cada conta"
      ],
      "c": 2,
      "e": "Confirme sempre por um canal que você já conhecia antes do pedido."
    },
    {
      "q": "Alguém sem crachá pede para passar junto com você na catraca. O que fazer?",
      "o": [
        "Deixar passar, é falta de educação recusar",
        "Pedir com educação que use o próprio crachá ou procure a recepção",
        "Passar o seu crachá duas vezes",
        "Ignorar e seguir"
      ],
      "c": 1,
      "e": "Educação e segurança andam juntas: oriente a pessoa a ir à recepção."
    },
    {
      "q": "Qual destas publicações é a MAIS arriscada nas redes sociais?",
      "o": [
        "Foto do pôr do sol",
        "Foto mostrando seu crachá da empresa",
        "Receita de bolo",
        "Foto do seu pet sem o nome"
      ],
      "c": 1,
      "e": "O crachá expõe nome, matrícula e o modelo do crachá para falsificação."
    },
    {
      "q": "Um pedido vem com \"é urgente\" e \"não conte para ninguém\". O que isso indica?",
      "o": [
        "Que é importante e deve ser feito logo",
        "Dois gatilhos clássicos de golpe: confirme antes de qualquer coisa",
        "Que vem da diretoria",
        "Nada de especial"
      ],
      "c": 1,
      "e": "Urgência + sigilo é a combinação favorita dos golpistas."
    }
  ],
  "lgpd": [
    {
      "q": "Qual destes é um dado pessoal SENSÍVEL?",
      "o": [
        "Nome completo",
        "Telefone",
        "Informação de saúde",
        "Cargo na empresa"
      ],
      "c": 2,
      "e": "Saúde, biometria, religião, origem racial, opinião política, filiação sindical, vida sexual e genética são sensíveis."
    },
    {
      "q": "Você precisa mandar um convite para 50 clientes. Como colocar os endereços?",
      "o": [
        "Todos no \"Para\"",
        "Todos no \"Cc\"",
        "Todos no \"Cco\" (cópia oculta)",
        "Um e-mail com a planilha anexa"
      ],
      "c": 2,
      "e": "Com Cco ninguém vê o endereço dos outros."
    },
    {
      "q": "O que diz o princípio da necessidade?",
      "o": [
        "Coletar o máximo de dados possível",
        "Usar e compartilhar só os dados realmente necessários",
        "Guardar os dados para sempre",
        "Pedir dados só quando houver necessidade financeira"
      ],
      "c": 1,
      "e": "Menos dados circulando = menos risco."
    },
    {
      "q": "Você enviou um arquivo com dados de clientes para a pessoa errada. O que fazer?",
      "o": [
        "Nada, provavelmente ninguém vai abrir",
        "Pedir à pessoa para apagar e não contar a ninguém",
        "Avisar imediatamente o gestor e a TI",
        "Esperar para ver se alguém reclama"
      ],
      "c": 2,
      "e": "A empresa tem prazo curto para agir e comunicar. Avisar rápido faz toda a diferença."
    },
    {
      "q": "Posso levar para casa, no meu pendrive pessoal, um relatório com dados de clientes?",
      "o": [
        "Sim, se eu tomar cuidado",
        "Sim, se o pendrive tiver senha",
        "Não: use apenas as ferramentas e o armazenamento da empresa",
        "Sim, se for só por um dia"
      ],
      "c": 2,
      "e": "Dados da empresa ficam em ambientes controlados pela empresa."
    }
  ],
  "dispositivos": [
    {
      "q": "Qual a forma mais segura de se conectar à internet num aeroporto?",
      "o": [
        "Wi-Fi gratuito do aeroporto",
        "Qualquer rede com sinal forte",
        "Roteador do próprio celular, de preferência com a VPN da empresa",
        "Rede com o nome de uma companhia aérea"
      ],
      "c": 2,
      "e": "A rede do seu celular é só sua. Em qualquer rede compartilhada, ligue a VPN."
    },
    {
      "q": "Você vai ao balcão do café por 1 minuto. O que fazer com o notebook?",
      "o": [
        "Deixar aberto, é rapidinho",
        "Bloquear a tela (Windows + L) ou levar com você",
        "Pedir para o vizinho de mesa olhar",
        "Fechar só o e-mail"
      ],
      "c": 1,
      "e": "Um minuto é suficiente para alguém acessar ou levar o equipamento."
    },
    {
      "q": "Para que serve a VPN da empresa?",
      "o": [
        "Deixar a internet mais rápida",
        "Criar um túnel protegido entre seu computador e a empresa, mesmo em redes não confiáveis",
        "Bloquear propagandas",
        "Economizar bateria"
      ],
      "c": 1,
      "e": "Com a VPN, ninguém na rede local consegue ver o que você acessa."
    },
    {
      "q": "Seu celular com e-mail corporativo foi roubado. Qual a primeira atitude?",
      "o": [
        "Comprar outro celular",
        "Avisar a TI imediatamente",
        "Esperar o boletim de ocorrência",
        "Mudar a foto do WhatsApp"
      ],
      "c": 1,
      "e": "A TI bloqueia os acessos e pode apagar os dados à distância. Rapidez é fundamental."
    },
    {
      "q": "É seguro carregar o celular numa porta USB pública do aeroporto?",
      "o": [
        "Sim, sempre",
        "Não é recomendado: prefira a tomada com seu carregador ou um powerbank",
        "Só se o celular estiver desligado",
        "Só durante o dia"
      ],
      "c": 1,
      "e": "Portas USB transmitem dados, e podem ter sido adulteradas."
    }
  ],
  "incidentes": [
    {
      "q": "Qual destes é um incidente de segurança que deve ser avisado?",
      "o": [
        "Esquecer a senha",
        "Notebook da empresa roubado",
        "Impressora sem papel",
        "Internet lenta num dia de chuva"
      ],
      "c": 1,
      "e": "Equipamento perdido ou roubado é incidente: a TI precisa bloquear os acessos."
    },
    {
      "q": "Você suspeita que abriu um arquivo com vírus. Qual a primeira coisa a fazer?",
      "o": [
        "Desligar o computador da tomada",
        "Parar de usar e desconectar da rede, depois avisar a TI",
        "Rodar vários antivírus baixados da internet",
        "Esperar o fim do dia"
      ],
      "c": 1,
      "e": "Desconectar impede que o problema se espalhe, sem destruir pistas."
    },
    {
      "q": "Por que não avisar sobre um problema na sua conta de e-mail usando apenas o próprio e-mail?",
      "o": [
        "Porque e-mail é lento",
        "Porque o invasor pode estar lendo e apagar o aviso",
        "Porque a TI não lê e-mails",
        "Não há problema nenhum"
      ],
      "c": 1,
      "e": "Use telefone ou outro canal quando a conta pode estar comprometida."
    },
    {
      "q": "Você caiu num golpe ontem e só percebeu hoje. O que fazer?",
      "o": [
        "Não contar, já passou",
        "Avisar a TI agora mesmo",
        "Esperar uma semana para ver se algo acontece",
        "Pedir a um colega para resolver em segredo"
      ],
      "c": 1,
      "e": "Nunca é tarde. Quanto antes a TI souber, menor o estrago."
    },
    {
      "q": "O que acontece com quem avisa a TI depois de cometer um erro?",
      "o": [
        "É punido",
        "Ajuda a proteger a empresa e os colegas",
        "Perde o acesso aos sistemas para sempre",
        "Precisa refazer o curso inteiro"
      ],
      "c": 1,
      "e": "O problema nunca é o erro, é o silêncio."
    }
  ]
};
