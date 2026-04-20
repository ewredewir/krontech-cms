import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawToken = searchParams.get('token');

  if (!rawToken) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  let decoded: string;
  try {
    decoded = Buffer.from(rawToken, 'base64url').toString('utf8');
  } catch {
    return NextResponse.json({ error: 'Malformed token' }, { status: 401 });
  }

  // Format: pageId:trSlug:enSlug:expiry:signature
  const lastColon = decoded.lastIndexOf(':');
  if (lastColon === -1) {
    return NextResponse.json({ error: 'Invalid token structure' }, { status: 401 });
  }

  const payload = decoded.slice(0, lastColon);
  const receivedSig = decoded.slice(lastColon + 1);
  const parts = payload.split(':');

  if (parts.length !== 4) {
    return NextResponse.json({ error: 'Invalid token structure' }, { status: 401 });
  }

  const [, trSlug, enSlug, expiryStr] = parts;
  const expiry = Number(expiryStr);

  if (!Number.isFinite(expiry) || Date.now() > expiry) {
    return NextResponse.json({ error: 'Token expired' }, { status: 401 });
  }

  const secret = process.env.REVALIDATE_SECRET ?? '';
  const expectedSig = createHmac('sha256', secret).update(payload).digest('hex');

  try {
    const a = Buffer.from(receivedSig, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Determine locale from Accept-Language or default to 'tr'
  const acceptLang = request.headers.get('accept-language') ?? '';
  const locale = acceptLang.toLowerCase().startsWith('en') ? 'en' : 'tr';
  const slug = locale === 'en' ? enSlug : trSlug;

  // Use forwarded headers to build the correct public origin (avoids leaking the
  // internal container port when Next.js runs behind Nginx).
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost';
  const origin = `${proto}://${host}`;

  return NextResponse.redirect(new URL(`/${locale}/${slug}?preview=1`, origin));
}
