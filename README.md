# Segurança em Dia — treinamento de conscientização

Curso de segurança da informação com 7 módulos interativos, quizzes e prova final
conferidos no servidor, certificado com código de verificação e área administrativa
com painel, relatório e exportação para Excel.

- **Login sem senha:** código de 6 dígitos por e-mail, só para quem está cadastrado.
- **Ciclo anual:** progresso, provas e certificados ficam guardados por ano; "Iniciar novo ciclo" recomeça sem apagar o histórico.
- **Conteúdo dos módulos:** `conteudo/` (HTML/CSS/JS/áudio), entregue só para quem está logado. Quizzes em `src/lib/quizzes.ts`, prova final em `src/lib/questoes.ts`.

## Desenvolvimento

    npm install
    npm run db:up          # Postgres em localhost:5437
    npx prisma migrate dev
    npm run db:seed        # administrador + cliente de demonstração (ver .env)
    npm run dev            # http://localhost:3500

Sem SMTP configurado, os códigos de acesso aparecem no terminal (`[EMAIL-TESTE]`).

Teste de ponta a ponta (com o servidor rodando e o log salvo em arquivo):

    LOG=caminho/do/log node scripts/teste-e2e.mjs

## Produção (VPS)

    git push vps main
    ssh deploy@VPS 'cd ~/treinamento && ./scripts/servidor/deploy.sh'

O app escuta em 127.0.0.1:3150; o Apache faz o HTTPS. Configuração em `~/treinamento/.env.producao`.
