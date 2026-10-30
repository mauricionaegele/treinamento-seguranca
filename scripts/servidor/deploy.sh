#!/usr/bin/env bash
#
# Atualiza o sistema no servidor para a versao mais recente enviada ao
# repositorio da VPS. Roda NO SERVIDOR, a partir da pasta do sistema:
#
#   ./scripts/servidor/deploy.sh
#
# Etapas: baixa o codigo -> backup do banco -> monta as imagens -> aplica as
# migracoes -> reinicia o sistema -> confere se ele respondeu.
# Se qualquer etapa falhar, o script para e o sistema antigo segue no ar.

set -euo pipefail

PASTA_SISTEMA="${PASTA_SISTEMA:-$HOME/treinamento}"
REPOSITORIO="${REPOSITORIO:-$HOME/treinamento.git}"
ARQUIVO_AMBIENTE="${ARQUIVO_AMBIENTE:-$PASTA_SISTEMA/.env.producao}"
RAMO="${RAMO:-main}"

cd "$PASTA_SISTEMA"

DC=(docker compose -f docker-compose.prod.yml --env-file "$ARQUIVO_AMBIENTE")

etapa() { printf '\n==> %s\n' "$1"; }

etapa "Baixando a versao mais recente ($RAMO)"
git --git-dir="$REPOSITORIO" --work-tree="$PASTA_SISTEMA" checkout -f "$RAMO"
echo "Versao: $(git --git-dir="$REPOSITORIO" log -1 --format='%h - %s' "$RAMO")"

if "${DC[@]}" ps --status running --services 2>/dev/null | grep -qx db; then
  etapa "Backup do banco antes de aplicar mudancas"
  ./scripts/servidor/backup.sh
else
  etapa "Banco ainda nao esta rodando - primeira instalacao, sem backup"
fi

etapa "Montando as imagens"
"${DC[@]}" --profile ferramentas build

etapa "Subindo o banco"
"${DC[@]}" up -d db

etapa "Aplicando migracoes do banco"
"${DC[@]}" run --rm ferramentas npx prisma migrate deploy

etapa "Dados iniciais (administrador; idempotente)"
"${DC[@]}" run --rm ferramentas npx tsx prisma/seed.ts

etapa "Reiniciando o sistema"
"${DC[@]}" up -d app

etapa "Conferindo se o sistema respondeu"
PORTA="$(grep -E '^APP_PORTA=' "$ARQUIVO_AMBIENTE" | cut -d= -f2)"
PORTA="${PORTA:-3150}"

for tentativa in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${PORTA}/entrar"; then
    echo "Sistema no ar (resposta em ${tentativa}s)."
    docker image prune -f >/dev/null
    exit 0
  fi
  sleep 1
done

echo "ATENCAO: o sistema nao respondeu em 30s. Ultimas linhas do registro:"
"${DC[@]}" logs --tail 40 app
exit 1
