# Stage 1 — Pruner
FROM node:20-bookworm-slim AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=@krontech/web --docker

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
ARG NEXT_PUBLIC_MEDIA_HOST
ENV NEXT_PUBLIC_MEDIA_HOST=$NEXT_PUBLIC_MEDIA_HOST

RUN corepack enable

EXPOSE 3000
# Build runs at container start (after API healthcheck passes via depends_on in docker-compose.yml),
# not at image build time — prevents fixtures from being baked in when DB is not yet seeded.
CMD ["sh", "-c", "pnpm turbo run build --filter=@krontech/web && pnpm --filter=@krontech/web start"]
