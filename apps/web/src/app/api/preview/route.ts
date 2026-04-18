import { NextRequest, NextResponse } from 'next/server';
import { draftMode } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const secret = searchParams.get('secret');
  const path = searchParams.get('path') ?? '/';

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  draftMode().enable();
  return NextResponse.redirect(new URL(path, request.url));
}
