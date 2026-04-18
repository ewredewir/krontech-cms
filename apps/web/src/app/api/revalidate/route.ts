import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { path?: unknown; secret?: unknown };

  if (body.secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (typeof body.path !== 'string') {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }

  revalidatePath(body.path);
  return NextResponse.json({ revalidated: true, path: body.path });
}
