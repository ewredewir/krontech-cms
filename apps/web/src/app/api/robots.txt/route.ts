export async function GET() {
  const disallowAll = process.env.ROBOTS_DISALLOW_ALL === 'true';

  const body = disallowAll
    ? `User-agent: *\nDisallow: /\n`
    : `User-agent: *\nDisallow: /admin/\nDisallow: /api/\nDisallow: /_next/\n\nSitemap: https://krontech.com/sitemap.xml\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
