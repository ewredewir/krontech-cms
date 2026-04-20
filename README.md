# Krontech CMS

> A production-grade headless CMS platform for krontech.com — Next.js 14 + NestJS + PostgreSQL

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser / Client                           │
└──────────────────────────────┬──────────────────────────────────────┘
                          │ :80 / :3002
                    ┌──────────▼──────────┐
                    │       nginx         │  Reverse proxy
                    │  :80/api → api:3001 │  Rate limiting (upstream)
                    │  :80/    → web:3000 │
                    │  :3002   → admin:3002│
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

| Service    | Host port(s) | Description |
|------------|--------------|-------------|
| `postgres` | 5433 → 5432  | PostgreSQL 15 database (host-exposed for dev tools; Docker-internal at `postgres:5432`) |
| `redis`    | 6379         | Rate limiting, refresh tokens, BullMQ queues, redirect cache |
| `minio`    | 9000, 9001   | S3-compatible object storage; S3 API at 9000, console UI at 9001 |
| `migrator` | —            | One-shot migration + conditional seed (exits after completion) |
| `api`      | internal :3001, not host-exposed | NestJS REST API — access via http://localhost/api |
| `web`      | internal :3000, not host-exposed | Next.js 14 public site — access via http://localhost |
| `admin`    | internal :3002, not host-exposed | Next.js 14 admin panel — access via http://localhost:3002 |
| `nginx`    | 80, 3002     | Reverse proxy — :80 → public site + API, :3002 → admin panel + API |
| `mailhog`  | 8025 (UI), 1025 (SMTP) | Mock SMTP UI (email transport is a stub — inbox will be empty) |

> **ISR cache boundary:** The Next.js ISR cache lives on the local container filesystem. This setup is designed for single-replica deployment. For horizontal scaling (multiple `web` replicas) a custom Next.js Cache Handler backed by Redis must be implemented so all nodes share the same ISR cache and any revalidation request invalidates every replica simultaneously. The required package is `@neshca/cache-handler-redis-strings`. `next.config.ts` reads `cacheHandler` conditionally based on a `CACHE_HANDLER` env var (`redis` vs default disk), so the Redis handler can be enabled without a code change.

---

## Quick Start

```bash
git clone <repo>
cd krontech-cms
cp .env.example .env
docker compose up -d --build
# First boot takes 3–5 minutes (compiling three TypeScript apps).
# Watch progress: docker compose logs -f
# Check status:   docker compose ps
```

> **First boot:** The first `docker compose up -d --build` compiles three TypeScript applications and may take 3–5 minutes. Subsequent boots use Docker layer cache and take seconds. Watch the migrator exit cleanly (`✓ Seed complete`) before opening the browser.

> **Re-seeding an existing database:** The seed is guarded — it skips if an admin user
> already exists, preserving any content created in the admin panel. To reset to the baseline
> seed data (e.g. for a clean demo): `docker compose exec api sh -c "cd /app/apps/api && FORCE_SEED=1 npx prisma db seed"`
> Or do a full reset: `docker compose down -v && docker compose up -d --build`

| App             | URL                                               |
|-----------------|---------------------------------------------------|
| Public site     | http://localhost              (nginx → Next.js web) |
| Admin panel     | http://localhost:3002         (nginx → Next.js admin) |
| API / Swagger   | http://localhost/api          (nginx → NestJS) |
| MailHog UI      | http://localhost:8025                             |
| MinIO console   | http://localhost:9001                             |
| MinIO S3 API    | http://localhost:9000                             |
| PostgreSQL      | localhost:5433                (direct, dev use only) |

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

### Rate limiting: per-user throttling via `AdminThrottlerGuard`

NestJS `ThrottlerModule` is configured with four named throttlers: `default` (300 req/min,
admin), `public` (60 req/min, public content), `auth` (10 req/min, login), and `form`
(5 req/10 min, form submission). A global `APP_GUARD` applies all four to every route by
default.

The challenge: inside Docker, nginx sets `X-Forwarded-For` to the Docker bridge gateway IP
(`172.x.x.1`) for all host traffic, not the real client IP. With a standard `ThrottlerGuard`
keyed on IP, all browser sessions share a single throttle bucket — effectively limiting the
entire admin panel to 10 requests/minute globally (the `auth` throttler's limit applying to
every request that hadn't opted out).

The fix: a custom `AdminThrottlerGuard` overrides `getTracker()` to return `req.user.id`
(JWT sub) for authenticated requests and `req.ip` as fallback for unauthenticated ones.
Each admin content controller applies `@SkipThrottle({ auth: true, public: true, form: true })`
so only the `default` throttler runs — 300 req/min per authenticated user, matching the spec.
Auth and form endpoints retain their specific throttlers. This is the correct architecture
regardless of Docker networking topology.

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

> **Note — Email transport:** The `EmailProcessor` BullMQ worker enqueues email notification
> jobs correctly, but the nodemailer SMTP transport is not wired in this implementation.
> MailHog (`http://localhost:8025`) will receive no messages from form submissions. The
> architecture is correct — replacing the stub with a real nodemailer/SES transport requires
> only implementing the `EmailProcessor.process()` method body.

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
# Unit + frontend tests (no Docker required)
pnpm turbo run test

# TypeScript check across all packages
pnpm turbo run typecheck

# E2e integration tests (requires live Docker stack)
docker compose up -d          # ensure all services are healthy first
cd apps/api && pnpm test:e2e  # runs auth + content lifecycle + public list endpoint suites
```

---

## Environment Variables

Copy `.env.example` to `.env` before first run. All variables must be set.

### Critical distinction: build-time vs runtime

**BUILD-TIME variables** are baked into the JavaScript bundle at `docker compose build`.
Changing them requires a full rebuild (`docker compose up -d --build`), not just a restart.

**RUNTIME variables** are read from `process.env` at request time inside the running
container. Changing them requires only `docker compose restart <service>`.

### Variable reference

| Variable | Type | Used by | Description |
|---|---|---|---|
| `POSTGRES_USER` | runtime | postgres, migrator | PostgreSQL username |
| `POSTGRES_PASSWORD` | runtime | postgres, migrator | PostgreSQL password |
| `POSTGRES_DB` | runtime | postgres, migrator | PostgreSQL database name |
| `DATABASE_URL` | runtime | local dev only | Host-machine Postgres URL (`localhost:5433`). Used by `prisma migrate dev` and test runners outside Docker. |
| `DOCKER_DATABASE_URL` | runtime | api, migrator | Docker-internal Postgres URL (`postgres:5432`). Used inside containers. |
| `REDIS_URL` | runtime | local dev only | Host-machine Redis URL (`localhost:6379`). Used by local test runners. |
| `DOCKER_REDIS_URL` | runtime | api | Docker-internal Redis URL (`redis:6379`). Used inside containers. |
| `MINIO_ROOT_USER` | runtime | minio | MinIO root username |
| `MINIO_ROOT_PASSWORD` | runtime | minio | MinIO root password |
| `S3_ENDPOINT` | runtime | api | S3/MinIO endpoint URL (internal: `http://minio:9000`) |
| `S3_BUCKET` | runtime | api | S3/MinIO bucket name |
| `S3_ACCESS_KEY` | runtime | api | S3/MinIO access key |
| `S3_SECRET_KEY` | runtime | api | S3/MinIO secret key |
| `JWT_ACCESS_SECRET` | runtime | api | Signs 15-minute access tokens. Generate: `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | runtime | api | Signs 7-day refresh tokens. Must differ from access secret. |
| `REVALIDATE_SECRET` | runtime | api, web | Shared secret for Next.js ISR on-demand revalidation. Must match in both services. |
| `TURNSTILE_SECRET_KEY` | runtime | api | Cloudflare Turnstile server-side validation key |
| `NEXT_PUBLIC_API_URL` | **BUILD-TIME** | web, admin | Browser-accessible API base URL. Value: `http://localhost/api`. Changing requires `--build`. |
| `NEXT_PUBLIC_MEDIA_HOST` | **BUILD-TIME** | web | Browser-accessible MinIO hostname. Value: `http://localhost:9000`. Changing requires `--build`. |
| `INTERNAL_MEDIA_HOST` | runtime | web | Docker-internal MinIO hostname (`http://minio:9000`). Used by Next.js server-side image fetching. |
| `INTERNAL_API_URL` | runtime | web | Docker-internal API URL (`http://nginx/api`). Used by Next.js server components during SSR/ISR — `NEXT_PUBLIC_API_URL` resolves to the container's own loopback server-side. |
| `ROBOTS_DISALLOW_ALL` | runtime | web | Set `true` in all non-production environments to output `Disallow: /` for all crawlers. |
| `NODE_ENV` | runtime | api, web, admin | `production` inside Docker, `development` for local dev |

> **INTERNAL_API_URL vs NEXT_PUBLIC_API_URL:** Both point to the API, but for different callers.
> `NEXT_PUBLIC_API_URL=http://localhost/api` is correct for the browser (user's machine resolves
> localhost → nginx). `INTERNAL_API_URL=http://nginx/api` is correct for Next.js server components
> running inside Docker (where localhost refers to the web container itself, not nginx). This is the
> same pattern used for `INTERNAL_MEDIA_HOST` vs `NEXT_PUBLIC_MEDIA_HOST`.

> **DOCKER_DATABASE_URL vs DATABASE_URL:** `DATABASE_URL` uses `localhost:5433` (the host-mapped
> port) and is only used by tools running on your machine (Prisma CLI, test runners). Inside Docker,
> Postgres is reachable only via the service name `postgres:5432`, hence `DOCKER_DATABASE_URL`.
