#!/usr/bin/env bash
#
# Copia completa do banco de dados, compactada. Roda NO SERVIDOR:
#   - automaticamente todo dia (cron)
#   - antes de cada deploy (chamado pelo deploy.sh)
#
# Mantem os ultimos DIAS_RETENCAO dias em $PASTA_BACKUPS.
# A copia fora do servidor (object storage) sera acrescentada quando houver
# um bucket configurado - ate la, os backups ficam apenas nesta maquina.
#
# Para restaurar um backup:
#   gunzip -c ARQUIVO.sql.gz | docker compose -f docker-compose.prod.yml \
#     --env-file .env.producao exec -T db psql -U treinamento -d treinamento

set -euo pipefail

PASTA_SISTEMA="${PASTA_SISTEMA:-$HOME/treinamento}"
ARQUIVO_AMBIENTE="${ARQUIVO_AMBIENTE:-$PASTA_SISTEMA/.env.producao}"
PASTA_BACKUPS="${PASTA_BACKUPS:-$HOME/backups/treinamento}"
DIAS_RETENCAO="${DIAS_RETENCAO:-14}"

cd "$PASTA_SISTEMA"
mkdir -p "$PASTA_BACKUPS"
chmod 700 "$PASTA_BACKUPS"

set -a
# shellcheck disable=SC1090
source "$ARQUIVO_AMBIENTE"
set +a

DESTINO="$PASTA_BACKUPS/treinamento-$(date +%Y-%m-%d_%H%M%S).sql.gz"

docker compose -f docker-compose.prod.yml --env-file "$ARQUIVO_AMBIENTE" exec -T db \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner \
  | gzip > "$DESTINO"

# Um arquivo pequeno demais indica que o dump falhou silenciosamente
if [ "$(stat -c %s "$DESTINO")" -lt 1024 ]; then
  echo "ERRO: backup suspeito (menos de 1 KB): $DESTINO" >&2
  exit 1
fi

chmod 600 "$DESTINO"
echo "Backup salvo: $DESTINO ($(du -h "$DESTINO" | cut -f1))"

find "$PASTA_BACKUPS" -name 'treinamento-*.sql.gz' -mtime "+$DIAS_RETENCAO" -delete
