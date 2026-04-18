---
name: Phase 4a complete — apps/web Next.js public site
description: apps/web Next.js 14 App Router public site built in Phase 4a
type: project
---

apps/web is now fully scaffolded and building clean.

**Key facts:**
- Next.js 14 with App Router, next-intl v3, Swiper 11, react-hook-form + zod + @hookform/resolvers
- Config file must be `next.config.mjs` (not `.ts` — Next.js 14 doesn't support `.ts` config)
- Roboto font weights available: 400, 500, 700 (NOT 600 — causes TS error)
- All server components that call `getTranslations()` must either pass explicit `{ locale, namespace }` OR have `setRequestLocale(locale)` called earlier in the request tree
- Every page.tsx default export must call `setRequestLocale(locale)` at the top before any next-intl API
- Test helper: `src/test/render.tsx` — `renderWithIntl()` wraps with `NextIntlClientProvider`
- `vi.mock` must be in the test file directly (not imported from a separate file) to be hoisted
- All 18 public assets downloaded successfully from krontech.com
- Build output: 49 static pages, zero TypeScript errors, zero `any` types
- 20 vitest tests pass (robots.txt, BlogCard, ContactForm, Header, HeroSlider)

**Why:** Phase 4a spec from CLAUDE.md / frontend_claude_code_prompt.md — pixel-accurate rebuild of krontech.com with ISR, i18n, SEO/GEO

**How to apply:** When continuing web work, note the `setRequestLocale` requirement for every page and the `next.config.mjs` naming constraint.
