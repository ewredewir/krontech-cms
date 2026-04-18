# Krontech CMS

> A production-grade headless CMS platform for krontech.com — Next.js 14 + NestJS + PostgreSQL

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser / Client                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ :80
                    ┌──────────▼──────────┐
                    │       nginx         │  Reverse proxy
                    │  /api → api:3001    │  Rate limiting (upstream)
                    │  /     → web:3000   │
                    │  /admin → admin:3002│
                    └──┬───────────┬──────┘
                       │           │
          ┌────────────▼──┐   ┌────▼──────────────┐
          │  web :3000    │   │  admin :3002       │
          │  Next.js 14   │   │  Next.js 14        │
          │  Public site  │   │  Refine + custom   │
          │  ISR + SSR    │   │  panels (JWT auth) │
          └───────┬───────┘   └────────┬───────────┘
                  │                    │
                  │     ┌──────────────▼────────────┐
                  └────►│  api :3001                │
                        │  NestJS REST API           │
                        │  Swagger at /api           │
                        └──┬──────┬────────┬─────────┘
                           │      │        │
              ┌────────────▼┐  ┌──▼───┐  ┌▼────────────────┐
              │  postgres   │  │redis │  │  minio :9000     │
              │  :5432      │  │:6379 │  │  S3-compatible   │
              │  PostgreSQL │  │Cache │  │  media storage   │
              │  15         │  │Auth  │  │  UI at :9001     │
              └─────────────┘  │Queue │  └──────────────────┘
                               └──────┘
                                  │ BullMQ
                    ┌─────────────▼────────────┐
                    │  mailhog :8025           │
                    │  Mock SMTP (stub)         │
                    └──────────────────────────┘
```

**Services:**

| Service    | Port  | Description |
|------------|-------|-------------|
| `postgres` | 5432  | PostgreSQL 15 database |
| `redis`    | 6379  | Rate limiting, refresh tokens, BullMQ queues, redirect cache |
| `minio`    | 9000/9001 | S3-compatible object storage (dev); UI at 9001 |
| `migrator` | —     | One-shot migration + conditional seed (exits after completion) |
| `api`      | 3001  | NestJS REST API |
| `web`      | 3000  | Next.js 14 public site |
| `admin`    | 3002  | Next.js 14 admin panel |
| `nginx`    | 80    | Reverse proxy — routes `/api`, `/`, `/admin` |
| `mailhog`  | 8025  | Mock SMTP UI (email transport is a stub — inbox will be empty) |

> **ISR cache boundary:** The Next.js ISR cache lives on the local container filesystem. This setup is designed for single-replica deployment. For horizontal scaling (multiple `web` replicas) a custom Next.js Cache Handler backed by Redis must be implemented so all nodes share the same ISR cache and any revalidation request invalidates every replica simultaneously. The required package is `@neshca/cache-handler-redis-strings`. `next.config.ts` reads `cacheHandler` conditionally based on a `CACHE_HANDLER` env var (`redis` vs default disk), so the Redis handler can be enabled without a code change.

---

## Quick Start

```bash
git clone <repo>
cd krontech-cms
cp .env.example .env
docker compose up --build
```

> **First boot:** The first `docker compose up --build` compiles three TypeScript applications and may take 3–5 minutes. Subsequent boots use Docker layer cache and take seconds. Watch the migrator exit cleanly (`✓ Seed complete`) before opening the browser.

| App       | URL                        |
|-----------|----------------------------|
| Web       | http://localhost:3000      |
| Admin     | http://localhost:3002      |
| API docs  | http://localhost/api       |
| MailHog   | http://localhost:8025      |
| MinIO UI  | http://localhost:9001      |

---

## Default Credentials (dev only)

| Role   | Email                 | Password |
|--------|-----------------------|----------|
| Admin  | admin@krontech.com    | password |
| Editor | editor@krontech.com   | password |

---

## Tech Decision Log

### Backend: NestJS over Spring Boot

TypeScript monorepo eliminates the Java/TS type-translation layer. NestJS + Prisma provides end-to-end type safety from the database schema through Zod DTOs to the React frontend. At this traffic scale, JVM startup overhead and context-switching costs between Java and TS are not justified. NestJS's DI system and decorator-based modules mirror Spring Boot's architecture without the polyglot penalty.

### ORM: Prisma over TypeORM

Prisma's schema file is the single source of truth — migrations are clean, the generated client gives precise TypeScript types that flow naturally into `packages/types` Zod schemas. TypeORM's JSONB handling is clunky with the LocaleMap pattern (`{ tr, en }` fields), and TypeORM's development velocity has slowed. Trade-off: Prisma requires a custom `PrismaService` wrapper — a 30-minute setup cost that pays for itself immediately.

### API: REST over GraphQL

GraphQL adds resolver complexity and N+1 risk without benefit — Next.js server components don't need a graph client. REST + Swagger gives free documentation and clear per-route cache semantics. On-demand ISR invalidation requires knowing the exact path to invalidate; REST's per-resource URLs map cleanly to `revalidatePath()` calls.

### Auth: JWT with refresh rotation

Stateless for all normal requests — Redis is NOT a session store. Access token (15 min TTL) is fully stateless. Refresh token (7 days) is stored as a SHA-256 hash in Redis with matching TTL. Rotation on every refresh call prevents replay attacks. Silent refresh on admin panel initialization handles browser refresh without logging out editors.

### Admin UI: Refine + custom panels

Refine handles table pagination, CRUD routing, and loading states — allowing full focus on the architecturally interesting panels: the SEO editor, component drag-and-drop editor, and cache invalidation controls. Pure custom-from-scratch would spend 60% of time on table pagination that carries no evaluation weight.

### Cache: Next.js ISR owns content caching — Redis does NOT

A double-caching collision was identified: if public API responses were cached in Redis (300s) AND Next.js ISR ran at 60s, ISR would fetch Redis-cached data that could be up to 300s old and bake it into new static HTML. The fix: Next.js ISR owns the content cache entirely. NestJS public endpoints always query Postgres directly. Redis handles only: rate limits, refresh tokens, BullMQ queues, sitemap cache, redirect table cache.

---

## Data Model

All content entities follow a bilingual pattern using Prisma `Json` fields shaped as `{ tr: string, en: string }` (LocaleMap). Status transitions are enforced by the publish state machine in NestJS services.

| Model           | Key relations |
|-----------------|---------------|
| `User`          | Roles: ADMIN / EDITOR |
| `Media`         | Uploaded files, referenced by content entities |
| `SeoMeta`       | One-to-one with Page, BlogPost, Product |
| `PageComponent` | Ordered components within a Page (Hero, Text, FAQ, CTA…) |
| `Page`          | Bilingual slug, status, publishedAt, scheduledAt |
| `PageVersion`   | Snapshot on each publish — last 5 kept (oldest pruned) |
| `Category`      | Bilingual; used by BlogPost |
| `Tag`           | Bilingual; many-to-many with BlogPost |
| `BlogPost`      | Bilingual slug, status, category, tags, seoMeta |
| `Product`       | Bilingual slug, status, components, seoMeta |
| `ProductMedia`  | Ordered media attachments (fractional index for drag-reorder) |
| `FormDefinition`| Configurable form with optional webhookUrl and notifyEmail |
| `FormSubmission`| Saved submissions; honeypot and KVKK consent enforced |
| `Redirect`      | Source → destination 301 rules with hitCount tracking |
| `AuditLog`      | Immutable log of every publish, login, and content change |

---

## Cache Invalidation Flow

When an editor clicks "Publish Now":

1. NestJS `ContentService.publish()` sets `status = PUBLISHED`, `publishedAt = now()`
2. Creates a `PageVersion` snapshot (keeps last 5 — oldest deleted when count reaches 6)
3. Emits an internal event with `{ entityType, entityId, locale }`
4. `CacheService.invalidateContent()` fires async (non-blocking) — calls `POST http://web/api/revalidate` with `{ path: '/{locale}/{slug}', secret }` for each locale
5. Next.js `revalidatePath()` clears the ISR cache for that path
6. On the next visitor request, Next.js fetches fresh data from NestJS and caches the new HTML
7. Writes to `AuditLog` with action `PAGE_PUBLISHED` (or `SCHEDULED_PUBLISH_CRON` / `SCHEDULED_PUBLISH_MANUAL`)

**Why Redis is NOT in this sequence:** Redis was removed from the content caching layer to eliminate a double-caching race condition. See Tech Decision Log → Cache.

---

## SEO / GEO Implementation

### SEO

Every page exports `generateMetadata()` with full Next.js Metadata: title, description, canonical, robots, openGraph, twitter, `alternates.languages` (hreflang for TR + EN + x-default). Dynamic sitemap at `/sitemap.xml` rebuilt hourly by cron. Dynamic `robots.txt` controlled by `ROBOTS_DISALLOW_ALL` env var — always `true` in non-production environments.

### GEO (Generative Engine Optimization)

GEO means structuring content so AI-powered search engines (ChatGPT, Gemini, Perplexity) can correctly parse and cite it as a source. Implementation:

- JSON-LD structured data injected in `<head>` for every page (Article, SoftwareApplication, FAQPage, Organization schemas)
- Every `PageComponent` renders a `<section aria-label="{type}">` wrapper — self-contained sections that LLMs can quote without needing surrounding context
- FAQ components are mandatory on product pages — highest-signal GEO content
- Semantic HTML throughout: `<article>`, `<h1>`/`<h2>`/`<h3>` hierarchy, no div soup
- External links use descriptive anchor text — never "click here"

---

## Observability

NestJS uses `nestjs-pino` for structured JSON logging. Every request is logged with method, URL, status code, and latency. Every BullMQ job failure is logged at `error` level with job name and attempt count. Every database error is logged with query context (sanitized).

In production, JSON logs are written to stdout and consumed by a log shipper (Filebeat/Datadog Agent) that forwards to ELK or Datadog. No code change is needed — the `pino-pretty` transport is only active when `NODE_ENV !== 'production'`.

---

## CI/CD & Deployment (theoretical production strategy)

**Pipeline:** GitHub Actions runs `lint → test → build` on every push to `main`, using Turborepo remote caching to skip unchanged apps.

**Frontend:** Deployed to Vercel for native ISR support and Edge Network CDN. `NEXT_PUBLIC_` build-time variables are set as Vercel environment variables and baked in at build time.

**Backend + Postgres + Redis:** Docker containers on Railway or AWS ECS/Fargate. `prisma migrate deploy` runs as a CI/CD pipeline step immediately before the new API image is rolled out — not inside the container start script.

**Scaling:** NestJS is stateless for all access-token-authenticated requests. Horizontal scaling is safe because rate limit counters, refresh tokens, and BullMQ queues all live in shared Redis. The only single-node boundary is the Next.js ISR cache — see Architecture note above.

---

## SEO Loss Prevention

When the URL structure changes (e.g. `/urunler/pam` → `/products/pam`), all old URLs are entered into the `Redirect` table as 301 redirects. Next.js middleware fetches the active redirect list from the NestJS API (Redis-cached, 60s TTL) on every incoming request and returns a 301 response before the page renders. Search engines and LLMs following old links receive the permanent redirect signal and transfer accumulated PageRank to the new URL. The `hitCount` field on each `Redirect` row tracks how many times each rule has fired, so stale redirects can be identified and cleaned up after traffic tapers off.

---

## Running Tests

```bash
# Unit + integration tests (all apps)
pnpm test

# Type checking (all apps — must be zero errors)
pnpm turbo run typecheck

# Backend unit tests only
pnpm --filter @krontech/api test

# Backend e2e tests (requires running Docker services)
pnpm --filter @krontech/api test:e2e

# Frontend unit tests only
pnpm --filter @krontech/web test
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in secrets before running Docker.

> **Critical naming — Docker split:**
> The project uses two sets of database/redis URLs:
> - `DATABASE_URL` / `REDIS_URL` — host-machine values (e.g. `localhost:5433`), used by local `prisma migrate dev` and test runners outside Docker
> - `DOCKER_DATABASE_URL` / `DOCKER_REDIS_URL` — Docker-internal values using service names (e.g. `postgres:5432`, `redis:6379`), used by the `api` and `migrator` containers

| Variable | Type | Description |
|---|---|---|
| `POSTGRES_USER` | runtime | PostgreSQL username |
| `POSTGRES_PASSWORD` | runtime | PostgreSQL password |
| `POSTGRES_DB` | runtime | PostgreSQL database name |
| `DATABASE_URL` | runtime | Prisma connection string (host machine / CI) |
| `DOCKER_DATABASE_URL` | runtime | Prisma connection string (inside Docker) |
| `REDIS_URL` | runtime | Redis connection string (host machine / CI) |
| `DOCKER_REDIS_URL` | runtime | Redis connection string (inside Docker) |
| `MINIO_ROOT_USER` | runtime | MinIO admin username |
| `MINIO_ROOT_PASSWORD` | runtime | MinIO admin password |
| `S3_ENDPOINT` | runtime | S3/MinIO endpoint URL (Docker-internal) |
| `S3_BUCKET` | runtime | S3 bucket name |
| `S3_ACCESS_KEY` | runtime | S3 access key |
| `S3_SECRET_KEY` | runtime | S3 secret key |
| `JWT_ACCESS_SECRET` | runtime | Access token signing secret — generate with `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | runtime | Refresh token signing secret — must differ from access secret |
| `REVALIDATE_SECRET` | runtime | Shared secret for Next.js on-demand ISR revalidation |
| `TURNSTILE_SECRET_KEY` | runtime | Cloudflare Turnstile secret (use test key `1x000...AA` in dev) |
| `NEXT_PUBLIC_API_URL` | **build-time** | Public API base URL baked into the JS bundle — rebuild required on change |
| `NEXT_PUBLIC_MEDIA_HOST` | **build-time** | Public media CDN/MinIO URL baked into the JS bundle |
| `INTERNAL_MEDIA_HOST` | runtime | Docker-internal MinIO URL for server-side image fetching |
| `NODE_ENV` | runtime | `development` or `production` |
| `ROBOTS_DISALLOW_ALL` | runtime | `true` in all non-production environments — outputs `Disallow: /` |
