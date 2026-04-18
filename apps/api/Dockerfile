# Stage 1 — Pruner
FROM node:20-bookworm-slim AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=@krontech/api --docker

# Stage 2 — Installer
FROM node:20-bookworm-slim AS installer
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable && pnpm install --frozen-lockfile

# Stage 3 — Builder + Runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .

RUN corepack enable

RUN npx prisma@5.22.0 generate --schema=apps/api/prisma/schema.prisma

RUN pnpm turbo run build --filter=@krontech/api
EXPOSE 3001
CMD ["node", "apps/api/dist/main"]
