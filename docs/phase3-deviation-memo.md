# Phase 3 Deviation Memo
**Date:** 2026-04-18  
**Scope:** All changes relative to the CLAUDE.md Phase 3 specification

---

## 1. Infrastructure / Docker

### 1.1 Alpine → Debian Bookworm-slim (all three Dockerfiles)

| | Spec (implied Alpine) | Actual |
|---|---|---|
| Base image | `node:20-alpine` | `node:20-bookworm-slim` |
| compat shim | `apk add --no-cache libc6-compat` | removed; glibc native |
| API system deps | none specified | `apt-get install -y openssl` in both installer and runner stages |

**Reason:** Prisma and Sharp ship native binaries compiled against glibc. Alpine uses musl; the binaries silently fail or crash at runtime. Bookworm-slim provides glibc out of the box.

### 1.2 `corepack enable` missing from Stage 3 (runner) in original commits

All three Dockerfiles originally had `corepack enable` only in the installer stage, making `pnpm` unavailable during the build step in Stage 3. Added to the runner stage in all three files.

### 1.3 Explicit Prisma client generation pinned to 5.22.0

CLAUDE.md does not specify this step. Added to the API Dockerfile runner stage:
```
RUN npx prisma@5.22.0 generate --schema=apps/api/prisma/schema.prisma
```
**Reason:** Without explicit generation the Prisma client is not compiled into the image. Pinning the version prevents drift from the lockfile version.

### 1.4 CMD paths corrected for Turborepo monorepo layout

The originally committed Dockerfiles used flat paths that work for standalone apps but not a pruned Turborepo workspace:

| Service | Original CMD | Correct CMD |
|---|---|---|
| api | `node dist/main` | `node apps/api/dist/main` |
| web | `node .next/standalone/server.js` | `node apps/web/.next/standalone/apps/web/server.js` |
| admin | `node .next/standalone/server.js` | `node apps/admin/.next/standalone/apps/admin/server.js` |

---

## 2. Docker Compose

### 2.1 `DATABASE_URL` → `DOCKER_DATABASE_URL` (migrator and api)

Original committed compose used `DATABASE_URL: ${DATABASE_URL}` for both `migrator` and `api`. This references the host-side connection string (typically `localhost:5433`). Inside Docker, Postgres is reachable only via the service name `postgres:5432`. Changed to `DOCKER_DATABASE_URL` which resolves to the internal address.

### 2.2 `REDIS_URL` → `DOCKER_REDIS_URL` (api)

Same class of bug. `redis://localhost:6379` does not resolve inside Docker. Changed to `DOCKER_REDIS_URL` which uses `redis://redis:6379`.

### 2.3 `migrator` missing `working_dir`

The original compose did not set `working_dir` for the migrator. Prisma CLI resolves `schema.prisma` relative to the working directory. Added `working_dir: /app/apps/api` so that `npx prisma migrate deploy` finds the schema.

### 2.4 API healthcheck: `wget` → `node -e fetch(...)`

`wget` and `curl` are not included in `node:20-bookworm-slim`. Replaced with a native Node.js fetch call:
```
node -e "fetch('http://localhost:3001/api/v1/health').then(r => {if(r.ok) process.exit(0); else process.exit(1)}).catch(() => process.exit(1))"
```

### 2.5 API healthcheck URL: `/health` vs `/api/v1/health`

**⚠️ Potential bug introduced in this session.**

The task prompt specified targeting `/api/v1/health`. However, `main.ts` explicitly excludes `health` from the global `api/v1` prefix:
```ts
app.setGlobalPrefix('api/v1', { exclude: ['health'] });
```
The actual NestJS health endpoint is therefore at `/health`, not `/api/v1/health`. The docker-compose healthcheck was changed to `/api/v1/health` following the task prompt, but this will return 404, causing the API to be marked `unhealthy`.

**Resolution required:** Either revert the healthcheck URL to `/health`, or remove `health` from the `exclude` list in `main.ts` (which makes the endpoint `GET /api/v1/health`). Recommend the former — keeping health outside the versioned prefix is conventional.

### 2.6 `start_period: 20s` added to API healthcheck

Not in the original spec. Added to give NestJS time to initialise (Prisma pool, Redis connection, module registration) before Docker begins evaluating retries.

### 2.7 Healthchecks added to `web` and `admin`

Not specified. Added so that `nginx` can depend on them with `service_healthy` instead of an unguarded list dependency. Without these, Docker Compose rejects the `service_healthy` condition.

### 2.8 `nginx` `depends_on` upgraded to `service_healthy` conditions

Original:
```yaml
depends_on:
  - web
  - admin
  - api
```
This means nginx starts immediately after the containers start, not after they are ready. Nginx attempts to resolve upstreams at startup; if they are not listening, it crashes. Changed to `condition: service_healthy` for all three.

---

## 3. Application Code (NestJS)

### 3.1 `@SkipThrottle()` argument difference

CLAUDE.md spec: `@SkipThrottle()` (no arguments)  
Actual: `@SkipThrottle({ default: true, public: true, auth: true, form: true })`

**Reason:** `ThrottlerModule` is configured with four named throttlers (`default`, `public`, `auth`, `form`). The bare `@SkipThrottle()` decorator only skips the first named throttler (`default`). To exempt the health controller from all four, every name must be explicitly opted out. Without this, the health endpoint still hits the `auth` (10/min) throttler and a docker healthcheck polling at 10s intervals reaches the 10-request-per-minute cap within 100 seconds, causing a 429 and a cascading `unhealthy` domino.

### 3.2 Redis injection: `@InjectRedis()` → `@Inject(REDIS_CLIENT)`

CLAUDE.md spec shows `@InjectRedis()` (implying `@nestjs-modules/ioredis` decorator).  
Actual uses `@Inject(REDIS_CLIENT)` with a custom token from `src/redis/redis.module.ts`.

The project bootstrapped with a custom Redis module rather than `@nestjs-modules/ioredis`. The token constant `REDIS_CLIENT` is exported from `redis.module.ts` and used consistently throughout.

### 3.3 Extra guard in `PagesService.publish()` for CRON on DRAFT

CLAUDE.md state machine permits `DRAFT → PUBLISHED ✓` unconditionally. The actual implementation adds:
```ts
if (page.status === 'DRAFT' && mode === 'CRON') {
  throw new BadRequestException('Cannot cron-publish a draft page');
}
```
**Reason:** The scheduler only processes `SCHEDULED` items. A `DRAFT` page should never reach the cron path; if it does, it indicates a bug. The guard makes that bug visible rather than silently publishing unreviewed content.

### 3.4 `schedule()` adds `ipAddress` parameter and audit log

CLAUDE.md spec shows `schedule(id, scheduledAt, userId)` — 3 params, no audit call.  
All three implementations (pages, blog, products) add `ipAddress: string` as a 4th parameter and emit an audit log entry (`PAGE_SCHEDULED`, `BLOG_POST_SCHEDULED`, `PRODUCT_SCHEDULED`). This is consistent with every other mutation in the system.

### 3.5 `cancelSchedule()` method added to all three modules

The CLAUDE.md state machine table includes `SCHEDULED → DRAFT ✓ (cancel schedule)` but the code snippets do not show a `cancelSchedule()` method. All three services and controllers implement it, exposing `DELETE /pages/:id/schedule`, `DELETE /blog/posts/:id/schedule`, and `DELETE /products/:id/schedule`.

### 3.6 BullMQ retry options: Worker constructor vs. job options

CLAUDE.md spec places `attempts` and `backoff` in the `Worker` constructor options:
```ts
new Worker('webhook', handler, {
  connection: ...,
  attempts: 3,           // ← not a valid Worker option
  backoff: { ... },      // ← not a valid Worker option
})
```
These are not valid BullMQ `WorkerOptions`. Retry configuration is a **job-level** option, not a worker-level option. The actual implementation correctly passes them in the `queue.add()` call inside `FormsService.submit()`:
```ts
await this.webhookQueue.add('deliver', data, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
});
```

### 3.7 Email worker is a stub (no transport wired)

CLAUDE.md implies a real email delivery mechanism. The `EmailProcessor` currently logs the notification payload and contains a comment noting that nodemailer/SES wiring is deferred. This is intentional for phase 3 — transport configuration depends on infrastructure decisions (SES vs. SMTP vs. Mailhog in dev) that are out of scope.

### 3.8 Scheduler: parallel fetch with `Promise.all`

CLAUDE.md shows three sequential `findMany` calls (one per entity type). The actual implementation fetches all three in a single `Promise.all`, reducing latency of the every-minute cron tick from sum-of-queries to max-of-queries.

### 3.9 `mediaService.hardDelete()` extracted from SchedulerService

CLAUDE.md shows the S3 deletion and Prisma hard-delete inline inside `SchedulerService.cleanupSoftDeletedMedia()`. The actual implementation delegates to `MediaService.hardDelete(media)`. This keeps S3 SDK usage co-located with the rest of the media lifecycle and allows the scheduler to remain storage-layer-agnostic.

### 3.10 `SeoService.getSitemap()` takes `cacheService` as a parameter

The method `getSitemap(cacheService: { getCachedSitemap(): Promise<string | null> })` injects the cache service as a parameter rather than as a constructor dependency. This avoids a circular dependency (`SeoModule` → `CacheModule` and `SchedulerModule` → both). Not ideal long-term — a proper solution is to move sitemap generation into a dedicated `SitemapService` — but it is functional for phase 3.

### 3.11 Additional methods not in spec

The following methods were added beyond what CLAUDE.md specifies. Each fills a logical gap in the API surface:

| Method | Module | Notes |
|---|---|---|
| `cancelSchedule()` | pages, blog, products | Covered in §3.5 above |
| `getVersions(pageId)` | pages | Needed to expose version history via `GET /pages/:id/versions` |
| `media.restore(id)` | media | Soft-delete inverse; missing it would leave soft-deleted media permanently hidden |
| `redirects.incrementHitCount(source)` | redirects | Used internally; not exposed as a public endpoint |

### 3.12 `multer` added as explicit dependency

`multer` was available only as a transitive peer dependency of `@nestjs/platform-express`. It was added explicitly to `apps/api/package.json` to make the dependency contract explicit and avoid breakage if `@nestjs/platform-express` stops bundling it.

### 3.13 `QueueModule` placeholder

An empty `QueueModule` (`src/queue/queue.module.ts`) is registered in `AppModule`. It is a placeholder for a future Bull Board dashboard or shared queue utilities. It has no providers and serves no current function. Not mentioned in CLAUDE.md.

---

## 4. Summary Table

| # | Area | Type | Severity |
|---|---|---|---|
| 1.1 | Alpine → Bookworm-slim | Bug fix | Critical — would fail at runtime |
| 1.2 | `corepack` in Stage 3 | Bug fix | Critical — pnpm unavailable for build |
| 1.3 | Prisma generate step | Addition | Critical — client missing from image |
| 1.4 | CMD paths | Bug fix | Critical — wrong entrypoint |
| 2.1 | DATABASE_URL env var | Bug fix | Critical — DB unreachable inside Docker |
| 2.2 | REDIS_URL env var | Bug fix | Critical — Redis unreachable inside Docker |
| 2.3 | migrator working_dir | Bug fix | Critical — migrate deploy fails |
| 2.4 | healthcheck wget → fetch | Bug fix | Critical — wget not installed |
| 2.5 | healthcheck URL `/api/v1/health` | **Regression introduced** | **High — health endpoint is at `/health`** |
| 2.6 | `start_period` | Enhancement | Medium — prevents false `unhealthy` on slow boot |
| 2.7 | web/admin healthchecks | Required addition | High — needed for nginx condition |
| 2.8 | nginx `service_healthy` | Enhancement | High — prevents upstream crash |
| 3.1 | `@SkipThrottle` all throttlers | Bug fix | High — health still rate-limited without this |
| 3.2 | Redis injection token | Spec deviation | Low — functionally equivalent |
| 3.3 | CRON guard on DRAFT | Enhancement | Low — defensive, consistent with intent |
| 3.4 | `schedule()` audit log | Enhancement | Low — consistent with other mutations |
| 3.5 | `cancelSchedule()` | Gap filled | Medium — state machine incomplete without it |
| 3.6 | BullMQ retry options location | Spec error corrected | Medium — spec was wrong, impl is correct |
| 3.7 | Email worker stub | Deferral | Low — documented inline |
| 3.8 | Scheduler parallel fetch | Enhancement | Low — performance only |
| 3.9 | `hardDelete` extraction | Refactor | Low — better cohesion |
| 3.10 | `getSitemap` parameter injection | Workaround | Low — avoids circular dep |
| 3.11 | Additional methods | Gap filled | Low |
| 3.12 | `multer` explicit dep | Hygiene | Low |
| 3.13 | `QueueModule` placeholder | Addition | Negligible |

---

## 5. Action Items

1. **Fix healthcheck URL** (§2.5): Change docker-compose healthcheck back to `/health` OR remove `health` from the `exclude` list in `main.ts`. The former is the simpler fix.
2. **Wire email transport** (§3.7): Add nodemailer/SES config once SMTP credentials are decided.
3. **Refactor `SeoService.getSitemap()`** (§3.10): Move to a dedicated `SitemapService` to avoid the awkward parameter injection pattern.
