FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000 8080 4080
CMD ["sh", "-c", "node scripts/port-proxy.mjs & npx prisma migrate deploy && node dist/src/main"]
