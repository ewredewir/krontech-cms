import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/lib/i18n';

type RedirectRule = { source: string; destination: string; statusCode: 301 | 302 };

const intlMiddleware = createIntlMiddleware({ locales, defaultLocale });

let cachedRedirects: RedirectRule[] = [];
let redirectsCachedAt = 0;

async function getRedirects(): Promise<RedirectRule[]> {
  if (Date.now() - redirectsCachedAt < 60_000) return cachedRedirects;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/public/redirects`);
    if (res.ok) {
      cachedRedirects = (await res.json()) as RedirectRule[];
      redirectsCachedAt = Date.now();
    }
  } catch {
    // Return stale cache on network error
  }
  return cachedRedirects;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const redirects = await getRedirects();
  const match = redirects.find((r) => r.source === pathname);
  if (match) {
    return NextResponse.redirect(new URL(match.destination, request.url), match.statusCode);
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

