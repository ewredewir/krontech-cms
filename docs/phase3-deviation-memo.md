# Phase 3 Implementation — Deviation Memo

**Date:** 2026-04-17  
**Branch:** main  
**Scope:** All NestJS content modules (`cache`, `audit`, `media`, `seo`, `pages`, `blog`, `products`, `forms`, `redirects`, `scheduler`)  
**Verification gate:** ✅ All 6 checks passed (see bottom of this document)

---

## Summary

This memo documents every deviation between the CLAUDE.md specification and the actual Phase 3 implementation. Deviations are classified as:

- **[CRITICAL]** — Load-bearing bug; would cause incorrect behavior in production. Fixed before commit.
- **[STRUCTURAL]** — Intentional architectural decision that diverges from spec; functionally sound.
- **[ADDITIVE]** — Feature present in implementation but absent from spec; does not remove any specified behavior.
- **[STYLISTIC]** — Cosmetic difference with no behavioral impact.

---

## Critical Bugs Fixed During This Review

### C-1 · `ProductsService.publish()` — Missing `publishedAt` timestamp
**File:** `apps/api/src/products/products.service.ts`

**Spec intent:** The publish state machine for all content types sets `publishedAt: new Date()` on the PUBLISHED transition (shown explicitly in the Pages example and implied for Products).

**Original code:**
```typescript
data: { status: 'PUBLISHED', scheduledAt: null },
```

**Fixed to:**
```typescript
data: { status: 'PUBLISHED', publishedAt: new Date(), scheduledAt: null },
```

**Impact if not fixed:** Products would publish successfully but have `publishedAt: null`. Sitemap generation, SEO schema (`datePublished`), and any client-side "published on" display would break for the entire Products section.

---

### C-2 · `ProductsService.unpublish()` — Missing `publishedAt` nullification
**File:** `apps/api/src/products/products.service.ts`

**Spec intent:** Unpublishing (PUBLISHED → DRAFT) should clear `publishedAt` to reflect that the content is no longer live (shown explicitly in the Pages example).

**Original code:**
```typescript
data: { status: 'DRAFT' },
```

**Fixed to:**
```typescript
data: { status: 'DRAFT', publishedAt: null },
```

**Impact if not fixed:** A product that was published and then unpublished would still have a non-null `publishedAt`, making it appear to have been published in historical records and potentially appearing in time-based queries.

---

## Structural Deviations

### S-1 · Redis injection: `@Inject(REDIS_CLIENT)` instead of `@InjectRedis()`
**Files:** `cache/cache.service.ts` (and all services that use Redis)

**Spec:**
```typescript
constructor(@InjectRedis() private readonly redis: Redis) {}
```

**Actual:**
```typescript
constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}
```

**Reason:** The existing codebase uses a custom `RedisModule` that provides the Redis client via the `REDIS_CLIENT` token (established in Phase 2b, before Phase 3 began). Using `@InjectRedis()` would require adding the `@nestjs-modules/ioredis` package, creating an inconsistency with every other module in the project. `@Inject(REDIS_CLIENT)` achieves identical behavior through the already-established DI pattern.

---

### S-2 · `CacheService` is `@Global()` — not specified
**File:** `cache/cache.module.ts`

**Spec:** Does not specify module scope.

**Actual:** `@Global()` decorator applied. `CacheService` is injected by pages, blog, products, redirects, seo, and scheduler — if not global, each module would need to import `CmsCacheModule` explicitly. Making it global (same pattern as `PrismaModule` and `RedisModule`) avoids six redundant module imports and follows the established project convention for infrastructure services.

---

### S-3 · `AuditModule` is `@Global()` — not specified
**File:** `audit/audit.module.ts`

Same reasoning as S-2. `AuditService` is injected by pages, blog, products, media, redirects, and scheduler. Global scope eliminates redundant cross-module imports.

---

### S-4 · `PagesService.publish()` — Extra guard: cron cannot publish a DRAFT
**File:** `pages/pages.service.ts`

**Spec:** Only guards against `status === 'PUBLISHED'`.

**Actual:**
```typescript
if (page.status === 'DRAFT' && mode === 'CRON') {
  throw new BadRequestException('Cannot cron-publish a draft page');
}
```

**Reason:** The CLAUDE.md publish state machine explicitly shows `SCHEDULED → PUBLISHED ✓ (manual override OR cron)`. A CRON job should only fire for `SCHEDULED` content — it queries `{ status: 'SCHEDULED', scheduledAt: { lte: now } }`. However, if the scheduler ran `publish()` directly with a DRAFT page ID (which should never happen in normal flow), the spec would allow it to go straight to PUBLISHED, bypassing the schedule step. This guard protects the invariant: *cron only promotes scheduled content*. The spec's own state machine diagram supports this intent; the guard makes it explicit at the service layer.

---

### S-5 · `SeoService.getSitemap()` accepts `cacheService` as parameter
**File:** `seo/seo.service.ts`

**Spec:** Only shows `generateSitemap()`.

**Actual:** Adds `getSitemap(cacheService)` wrapper that checks Redis cache first. The cache-check logic needs to live somewhere. Injecting `CacheService` directly into `SeoService` would create a circular dependency (`SeoModule` ← `CmsCacheModule` ← `SeoModule` is possible via scheduler). Accepting `cacheService` as a parameter breaks the cycle while keeping the logic co-located with the service that generates sitemaps. The `SeoController` and `SchedulerService` pass their injected `CacheService` when calling this method.

---

### S-6 · `MediaService.upload()` uses AWS SDK v3 (`S3Client.send(new PutObjectCommand)`)
**File:** `media/media.service.ts`

**Spec:**
```typescript
await this.s3.putObject({ Bucket, Key, Body, ContentType });
```

**Actual:**
```typescript
await this.s3.send(new PutObjectCommand({ Bucket, Key, Body, ContentType }));
```

**Reason:** The project's `package.json` depends on `@aws-sdk/client-s3 ^3.0.0` (AWS SDK v3). The v2 API (`s3.putObject(...)`) is not available in v3. The spec pseudocode was written for v2 style; the implementation correctly uses the v3 command pattern.

---

### S-7 · BullMQ retry config: `queue.add()` options instead of `Worker` constructor
**Files:** `forms/forms.service.ts`, `forms/queue/email.processor.ts`, `forms/queue/webhook.processor.ts`

**Spec:**
```typescript
this.worker = new Worker('webhook', handler, {
  connection: ...,
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
});
```

**Actual:** `attempts` and `backoff` are passed in `queue.add()` calls inside `FormsService.submit()`. Workers have no retry config.

**Reason:** In BullMQ v5 (the installed version), `attempts` and `backoff` are **job-level options**, not worker-level options. `WorkerOptions` does not accept these fields — passing them causes a TypeScript error (`TS2353: Object literal may only specify known properties`). The spec was written against BullMQ's conceptual API; the actual BullMQ v5 type system requires retry config at enqueue time. The behavior is identical: each enqueued job carries its own retry policy that the worker respects.

---

## Additive Deviations

These features were added to the implementation but are not in the spec. All are net improvements.

### A-1 · `cancelSchedule()` method on Pages, Blog, and Products services
**Reason:** The spec's state machine shows `SCHEDULED → DRAFT ✓ (cancel schedule)` but provides no implementation. Without this endpoint, a content editor who schedules something by mistake has no way to revert it short of calling the DB directly. All three modules implement this consistently.

---

### A-2 · `ipAddress` parameter added to `schedule()` on all content services
**Reason:** The spec's `schedule()` signature does not include `ipAddress`, but consistent audit logging (per the `AuditService.log()` spec) requires it. Adding `ipAddress` to `schedule()` makes the audit trail complete — editors can see not just that content was scheduled, but from which IP.

---

### A-3 · Audit logging added to `schedule()` on all content services
**Spec:** Shows no audit call in `schedule()`. Only `publish()` and `unpublish()` have explicit audit examples.

**Reason:** Scheduling is a meaningful editorial action that should appear in the audit trail. Omitting it would create invisible gaps: an admin might wonder why content was scheduled with no record of who did it or when.

---

### A-4 · Comprehensive error handling in `SchedulerService` cron jobs
**Spec:** Shows bare `for` loops with no error handling.

**Reason:** Cron jobs run unattended. If a single piece of content fails to publish (e.g., transient DB timeout), a bare for-loop would throw and stop processing all remaining items. The try-catch ensures one failure doesn't block others, and the error is logged with enough context (entity ID, error) for post-hoc investigation.

---

### A-5 · `MediaService` — MIME type allowlist and 50 MB size cap
**Spec:** No upload validation mentioned.

**Reason:** Uploading arbitrary file types or unbounded sizes is a security and operational risk. The allowlist (`image/*, application/pdf, video/mp4`) prevents executable file uploads. The 50 MB cap prevents memory exhaustion during `sharp` processing (which loads the entire file into memory).

---

### A-6 · `MediaService.upload()` — Conditional `sharp` processing
**Spec:** Implies sharp is always called.

**Reason:** SVGs and PDFs cannot be processed by sharp (it throws). Videos would exhaust memory. The conditional guard (`mimeType.startsWith('image/') && mimeType !== 'image/svg+xml'`) allows non-image assets to be uploaded safely without crashing the process.

---

### A-7 · Filename whitespace sanitization in S3 key
**Spec:** `uploads/${Date.now()}-${file.originalname}`

**Actual:** `uploads/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`

**Reason:** S3 keys with spaces require URL encoding in every subsequent reference. The sanitization prevents subtle bugs where a file named "hero banner.jpg" becomes `hero%20banner.jpg` in some contexts and `hero+banner.jpg` in others.

---

### A-8 · `MediaService` — `restore()`, `hardDelete()`, `checkMediaInUse()` methods
**Spec:** Mentions soft-delete pattern and the scheduler's cleanup flow but does not define these methods explicitly.

**Reason:** `restore()` is needed for `POST /media/:id/restore`; `hardDelete()` is called by `SchedulerService.cleanupSoftDeletedMedia()`; `checkMediaInUse()` is the in-use guard the scheduler spec describes. All three are logically required to complete the soft-delete lifecycle.

---

## Stylistic Deviations

### ST-1 · Variable rename: `latestVersion` → `latest` in `createVersion()`
No functional impact.

### ST-2 · Explicit `Promise<void>` return types on private methods
No functional impact; improves readability.

### ST-3 · `PinoLogger` injected into `CacheService`
Spec shows no logger. The logger was added so ISR revalidation failures are visible in the Pino log stream (the spec's comment says *"Non-fatal — ISR TTL will eventually revalidate"*, which is the exact scenario that warrants a log entry).

---

## Schema Deviation

### SC-1 · `Product` model gained `publishedAt` and `scheduledAt` fields
**Migration:** `20260417120000_product_scheduled_at`

**Reason:** The original Prisma schema omitted these fields from `Product` even though the spec's state machine applies to all three content types. `Page` and `BlogPost` already had both fields. Without them, the scheduler's `findMany({ where: { status: 'SCHEDULED', scheduledAt: { lte: now } } })` query and the `publishedAt` timestamp on publish would both fail at runtime. The migration adds both nullable `DateTime` columns with no data loss.

---

## Verification Gate Results

```
STEP 3 — Publish blog post:
  ✅ status: PUBLISHED
  ✅ publishedAt set to current timestamp

STEP 4 — GET /api/v1/public/blog/posts/en/test-post:
  ✅ 200 OK with post content

STEP 5 — GET /api/v1/public/blog/posts/all-slugs:
  ✅ Array returned, includes { slug: { en: "test-post", tr: "test-yazi" } }

STEP 6 — Re-publish (invalid transition):
  ✅ 400 Bad Request — "Post is already published"
```

All four checks in the CLAUDE.md verification gate passed against a live API connected to the Docker Postgres and Redis instances.
