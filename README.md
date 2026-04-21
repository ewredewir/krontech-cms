# Krontech CMS

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/ewredewir/krontech-cms)

> A production-grade headless CMS platform for krontech.com — Next.js 14 + NestJS + PostgreSQL

## Architecture

```text
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

### Docker Service Orchestration (`docker-compose.yml`)

The stack relies on a strict dependency chain to ensure services boot correctly:

1. **Database:** Starts first.
2. **Migrator:** Waits for `postgres` to be healthy (`condition: service_healthy`), then runs `npx prisma migrate deploy && npx prisma db seed`.
3. **API:** Waits for the migrator to finish (`condition: service_completed_successfully`) before starting.
4. **Nginx:** Acts as the entry point, routing `/api` traffic to the upstream `api` service (`nginx.conf`).

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

> **Re-seeding an existing database:** The seed is guarded (`seed.ts`) — it skips if an admin user already exists, preserving any content created in the admin panel. To reset to the baseline seed data (e.g. for a clean demo): `docker compose exec api sh -c "cd /app/apps/api && FORCE_SEED=1 npx prisma db seed"`
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

*(Admin user is provisioned automatically with a hashed password via `seed.ts` during the migrator phase).*

---

## Tech Decision Log & Application Bootstrap

### Backend: NestJS over Spring Boot

TypeScript monorepo eliminates the Java/TS type-translation layer. NestJS + Prisma provides end-to-end type safety from the database schema through Zod DTOs to the React frontend.

**Bootstrap configuration (`main.ts`):**
- Uses buffered logs during initialization.
- Applies a global `ZodValidationPipe` to all incoming requests.
- Sets a global prefix `/api/v1` (excluding the `/health` check).
- Sets `trust proxy: 1` to correctly resolve client IPs behind Nginx.
- Configures Swagger documentation exposed at `/api`.

### ORM: Prisma over TypeORM

Prisma's schema file is the single source of truth. Migrations are clean, the generated client gives precise TypeScript types that flow naturally into `packages/types` Zod schemas.

### Auth: JWT with refresh rotation

Stateless for all normal requests — Redis is NOT a session store. Access token (15 min TTL) is fully stateless. Refresh token (7 days) is stored as a SHA-256 hash in Redis with matching TTL.

### Rate limiting: per-user throttling via `AdminThrottlerGuard`

NestJS `ThrottlerModule` is configured with four named throttlers. Because Nginx sets `X-Forwarded-For` to the Docker bridge gateway IP inside the network, a custom `AdminThrottlerGuard` falls back to `req.user.id` (JWT sub) for authenticated requests.

---

## Data Model & Seeding (`seed.ts`)

All content entities follow a bilingual pattern using Prisma `Json` fields shaped as `{ tr: string, en: string }` (LocaleMap). Status transitions are enforced by the publish state machine.

During the Docker build, `seed.ts` populates the initial structure:

1. Verifies if an Admin exists (skips if true).
2. Creates the base Admin user.
3. Uses `upsert` to inject stable, predefined `PageComponent` layouts (Hero, Text, FAQ).
4. Publishes initial content (sets `status: PUBLISHED` and `publishedAt: new Date()`).
5. Generates the bilingual `NavigationItem` tree.

---

## Cache Invalidation Flow

When an editor clicks "Publish Now", the system triggers an orchestrated cross-container cache invalidation sequence:

1. **NestJS updates DB:** `ContentService.publish()` sets `status = PUBLISHED`, `publishedAt = now()` and creates a `PageVersion` snapshot.
2. **Internal Event:** Emits an event with `{ entityType, entityId, locale }`.
3. **Trigger Cache Service:** `CacheService.invalidateContent()` fires asynchronously (`cache.service.ts`).
4. **Construct Internal URL:** Builds the revalidation endpoint: `${base}/api/revalidate`.
5. **Dispatch HTTP Request:** Sends a `POST` request to the Next.js `web` container, passing the target path and `REVALIDATE_SECRET`.
6. **Next.js Receives Request:** The route handler (`route.ts`) catches the POST request.
7. **Clear ISR Cache:** Next.js executes `revalidatePath(body.path)`.
8. **Audit Logging:** Writes to `AuditLog` with action `PAGE_PUBLISHED`.

*Redis is intentionally excluded from the content caching layer to prevent double-caching race conditions between the API and Next.js ISR.*

---

## SEO, GEO, and i18n Implementation

### Next.js Internationalization & Layout (`layout.tsx`)

The frontend is deeply integrated with a bilingual structure:

- **Static Generation:** `generateStaticParams()` pre-builds routes for both `tr` and `en` locales.
- **Locale Context:** `setRequestLocale(locale)` injects the current language into the rendering context.
- **Navigation Fetching:** The layout fetches menu data via `apiFetch()` pointing to `/v1/public/navigation/{locale}`, caching it with an ISR tag (`nav-${locale}`).
- **Hreflang SEO Setup:** Automatically injects `alternates.languages` metadata for accurate cross-regional search engine indexing (e.g., `tr: https://krontech.com/tr`).

### GEO (Generative Engine Optimization)

GEO means structuring content so AI-powered search engines can correctly parse and cite it:

- JSON-LD structured data injected in `<head>` for every page.
- Every `PageComponent` renders a `<section aria-label="{type}">` wrapper.
- Semantic HTML throughout: `<article>`, `<h1>`/`<h2>`/`<h3>` hierarchy, no div soup.

---

## CI/CD & Multi-Stage Docker Build (`Dockerfile`)

The infrastructure utilizes an optimized, multi-stage Docker build process tailored for a Turborepo monorepo:

1. **Pruner Stage:** Starts with `node:20-bookworm-slim`.
2. **Turbo Pruning:** Runs `turbo prune --scope=@krontech/api --docker` to isolate only the necessary dependencies for the specific target.
3. **Environment Injection:** Build-time variables (like `NEXT_PUBLIC_API_URL`) are loaded via `ARG` and `ENV` commands to be baked into the Next.js bundle.
4. **Prisma Generation:** Executes `npx prisma generate` to create the TypeScript client locally within the container.
5. **Build & Start:** Executes the final build command (e.g., `pnpm turbo run build --filter=@krontech/web`) and starts the specific app server at runtime.

---

## Environment Variables

Copy `.env.example` to `.env` before first run. All variables must be set.

### Critical distinction: build-time vs runtime

**BUILD-TIME variables** are baked into the JavaScript bundle at `docker compose build`. Changing them requires a full rebuild (`docker compose up -d --build`), not just a restart.

**RUNTIME variables** are read from `process.env` at request time inside the running container. Changing them requires only `docker compose restart <service>`.

### Variable reference

| Variable | Type | Used by | Description |
|---|---|---|---|
| `POSTGRES_USER` | runtime | postgres, migrator | PostgreSQL username |
| `POSTGRES_PASSWORD` | runtime | postgres, migrator | PostgreSQL password |
| `POSTGRES_DB` | runtime | postgres, migrator | PostgreSQL database name |
| `DATABASE_URL` | runtime | local dev only | Host-machine Postgres URL (`localhost:5433`). |
| `DOCKER_DATABASE_URL` | runtime | api, migrator | Docker-internal Postgres URL (`postgres:5432`). |
| `REDIS_URL` | runtime | local dev only | Host-machine Redis URL (`localhost:6379`). |
| `DOCKER_REDIS_URL` | runtime | api | Docker-internal Redis URL (`redis:6379`). |
| `MINIO_ROOT_USER` | runtime | minio | MinIO root username |
| `MINIO_ROOT_PASSWORD` | runtime | minio | MinIO root password |
| `S3_ENDPOINT` | runtime | api | S3/MinIO endpoint URL (internal: `http://minio:9000`) |
| `S3_BUCKET` | runtime | api | S3/MinIO bucket name |
| `S3_ACCESS_KEY` | runtime | api | S3/MinIO access key |
| `S3_SECRET_KEY` | runtime | api | S3/MinIO secret key |
| `JWT_ACCESS_SECRET` | runtime | api | Signs 15-minute access tokens. |
| `JWT_REFRESH_SECRET` | runtime | api | Signs 7-day refresh tokens. |
| `REVALIDATE_SECRET` | runtime | api, web | Shared secret for Next.js ISR on-demand revalidation. |
| `TURNSTILE_SECRET_KEY` | runtime | api | Cloudflare Turnstile server-side validation key |
| `NEXT_PUBLIC_API_URL` | **BUILD-TIME** | web, admin | Browser-accessible API base URL. Value: `http://localhost/api`. |
| `NEXT_PUBLIC_MEDIA_HOST` | **BUILD-TIME** | web | Browser-accessible MinIO hostname. Value: `http://localhost:9000`. |
| `INTERNAL_MEDIA_HOST` | runtime | web | Docker-internal MinIO hostname (`http://minio:9000`). |
| `INTERNAL_API_URL` | runtime | web | Docker-internal API URL (`http://nginx/api`). |
| `ROBOTS_DISALLOW_ALL` | runtime | web | Set `true` in all non-production environments. |
| `NODE_ENV` | runtime | api, web, admin | `production` inside Docker, `development` for local dev |