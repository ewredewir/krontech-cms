import { locales } from '@/lib/i18n';

const BASE_URL = 'https://krontech.com';

function generateXml(urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: string }>) {
  const urlElements = urls
    .map(
      (url) => `
  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

export async function GET() {
  try {
    const cached = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/seo/sitemap`,
      { cache: 'no-store' }
    ).then((r) => (r.ok ? r.text() : null)).catch(() => null);

    if (cached) {
      return new Response(cached, { headers: { 'Content-Type': 'application/xml' } });
    }
  } catch {
    // Fallback to static URL sitemap
  }

  const urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: string }> = [];

  for (const locale of locales) {
    urls.push({
      loc: `${BASE_URL}/${locale}`,
      changefreq: 'weekly',
      priority: '1.0',
    });

    urls.push({
      loc: `${BASE_URL}/${locale}/blog`,
      changefreq: 'daily',
      priority: '0.8',
    });

    urls.push({
      loc: `${BASE_URL}/${locale}/products`,
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  const xml = generateXml(urls);

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
