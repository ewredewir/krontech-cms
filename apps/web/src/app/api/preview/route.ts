import { createHmac, timingSafeEqual } from 'crypto';
import { cookies, draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token  = searchParams.get('token') ?? '';
  const locale = (searchParams.get('locale') ?? 'tr') as 'tr' | 'en';

  let decoded: string;
  try { decoded = Buffer.from(token, 'base64url').toString('utf8'); }
  catch { return new Response('Malformed token', { status: 401 }); }

  const lastColon = decoded.lastIndexOf(':');
  if (lastColon === -1) return new Response('Invalid token', { status: 401 });

  const payload     = decoded.slice(0, lastColon);
  const receivedSig = decoded.slice(lastColon + 1);
  const parts       = payload.split(':');
  if (parts.length !== 4) return new Response('Invalid token', { status: 401 });

  const expiry = Number(parts[3]);
  if (!Number.isFinite(expiry) || Date.now() > expiry)
    return new Response('Token expired', { status: 401 });

  const secret      = process.env.REVALIDATE_SECRET ?? '';
  const expectedSig = createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(receivedSig, 'hex');
  const b = Buffer.from(expectedSig, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b))
    return new Response('Invalid signature', { status: 401 });

  draftMode().enable();
  cookies().set('__preview_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  });

  // parts[1] = trSlug, parts[2] = enSlug
  const slug = locale === 'tr' ? parts[1] : parts[2];
  redirect(`/${locale}/${slug}`);
}
