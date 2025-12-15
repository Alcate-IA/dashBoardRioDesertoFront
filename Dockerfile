# Multi-stage Dockerfile para Next.js (produção)
# Stage 1: Builder
FROM node:18-alpine AS builder

# Definições de ambiente para build
ENV NODE_ENV=production

# Diretório de trabalho
WORKDIR /app

# Copia apenas os manifests primeiro (cache das deps)
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Instala dependências (preferindo npm; ajuste se usar yarn/pnpm)
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then npm -g install pnpm && pnpm i --frozen-lockfile; \
    else npm i; fi

# Copia o restante do código
COPY . .

# Build de produção do Next
RUN npm run build || (echo "Falling back to yarn build" && yarn build) || (echo "Falling back to pnpm build" && pnpm build)

# Stage 2: Runner (imagem final enxuta)
FROM node:18-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3000

# Diretório de trabalho
WORKDIR /app

# Copiar apenas os artefatos necessários do builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/node_modules ./node_modules

# (Opcional) desabilitar telemetria do Next
ENV NEXT_TELEMETRY_DISABLED=1

# Expor porta
EXPOSE 3000

# Comando de inicialização
CMD ["npm", "run", "start"]
