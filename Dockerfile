# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --- Dependências completas ----------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- Build ---------------------------------------------------------------------
FROM deps AS builder
COPY . .
# O prisma.config.ts exige DATABASE_URL até para gerar o cliente; este valor
# não é usado para conectar em lugar nenhum.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npx prisma generate && npm run build

# --- Ferramentas: migrações e dados iniciais (docker compose run ferramentas ...)
FROM builder AS ferramentas
CMD ["npx", "prisma", "migrate", "deploy"]

# --- Aplicação -----------------------------------------------------------------
FROM base AS app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Módulos do curso (HTML, CSS, JS e áudios), entregues só para quem está logado
COPY --from=builder --chown=nextjs:nodejs /app/conteudo ./conteudo

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
