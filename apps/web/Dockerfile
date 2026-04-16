# Stage 1 — Pruner
FROM node:20-alpine AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=@krontech/web --docker

# Stage 2 — Installer
FROM node:20-alpine AS installer
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable && pnpm install --frozen-lockfile

# Stage 3 — Builder + Runner
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MEDIA_HOST
ENV NEXT_PUBLIC_MEDIA_HOST=$NEXT_PUBLIC_MEDIA_HOST
RUN pnpm turbo run build --filter=@krontech/web
EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]
