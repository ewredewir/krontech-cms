import { cookies, draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET() {
  draftMode().disable();
  cookies().delete('__preview_token');
  redirect('/');
}
