# Stage 1 — Pruner
FROM node:20-bookworm-slim AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=@krontech/admin --docker

# Stage 2 — Installer
FROM node:20-bookworm-slim AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable && pnpm install --frozen-lockfile

# Stage 3 — Builder + Runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN corepack enable

RUN pnpm turbo run build --filter=@krontech/admin
EXPOSE 3002
CMD ["node", "apps/admin/.next/standalone/apps/admin/server.js"]
