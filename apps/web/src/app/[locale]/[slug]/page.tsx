import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { apiFetch } from '@/lib/api';
import { PageBanner } from '@/components/shared/PageBanner';
import { SeoHead } from '@/components/shared/SeoHead';
import { SectionRenderer } from '@/components/SectionRenderer';
import type { ApiPageComponent } from '@/components/SectionRenderer';

export const revalidate = 60;

interface LocaleMap { tr: string; en: string }

interface ApiPage {
  id: string;
  slug: LocaleMap;
  status: string;
  components: ApiPageComponent[];
  seo: {
    metaTitle: LocaleMap | null;
    metaDescription: LocaleMap | null;
    ogImage: { publicUrl: string } | null;
  } | null;
}

interface PageProps {
  params: { locale: string; slug: string };
}

export async function generateStaticParams() {
  const slugMaps =
    (await apiFetch<Array<{ slug: LocaleMap }>>('/v1/public/pages/all-slugs')) ?? [];
  return locales.flatMap((locale) =>
    slugMaps
      .map((item) => ({ locale, slug: item.slug[locale as Locale] }))
      .filter((p) => Boolean(p.slug)),
  );
}

async function getPage(locale: Locale, slug: string): Promise<ApiPage | null> {
  return apiFetch<ApiPage>(`/v1/public/pages/${locale}/${slug}`, {
    next: { revalidate: 60 },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as Locale;
  const page = await getPage(locale, params.slug);
  if (!page) return { title: 'Not Found' };

  const title = page.seo?.metaTitle?.[locale] ?? page.slug[locale];
  const description = page.seo?.metaDescription?.[locale] ?? '';

  return {
    title,
    description,
    alternates: {
      canonical: `https://krontech.com/${locale}/${params.slug}`,
      languages: {
        tr: `https://krontech.com/tr/${page.slug.tr}`,
        en: `https://krontech.com/en/${page.slug.en}`,
      },
    },
    openGraph: {
      title,
      description,
      images: page.seo?.ogImage ? [{ url: page.seo.ogImage.publicUrl }] : [],
    },
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function DynamicPage({ params }: PageProps) {
  const locale = params.locale as Locale;
  setRequestLocale(locale);

  const page = await getPage(locale, params.slug);
  if (!page) notFound();

  const title = page.seo?.metaTitle?.[locale] ?? page.slug[locale];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Krontech', item: 'https://krontech.com' },
      { '@type': 'ListItem', position: 2, name: title },
    ],
  };

  return (
    <>
      <SeoHead jsonLd={breadcrumbJsonLd} />
      <PageBanner title={title} />
      <main>
        {page.components.map((component) => (
          <SectionRenderer key={component.id} section={component as ApiPageComponent} locale={locale} />
        ))}
      </main>
    </>
  );
}
