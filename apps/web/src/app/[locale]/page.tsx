import type { Metadata } from 'next';
import { cookies, draftMode } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { apiFetch } from '@/lib/api';
import { SeoHead } from '@/components/shared/SeoHead';
import { SectionRenderer } from '@/components/SectionRenderer';
import type { ApiPageComponent } from '@/components/SectionRenderer';

export const revalidate = 60;

// Slug used by the homepage Page record in the DB
const HOMEPAGE_SLUG: Record<Locale, string> = { tr: 'anasayfa', en: 'home' };

interface LocaleMap { tr: string; en: string }

interface ApiPage {
  id: string;
  slug: LocaleMap;
  components: ApiPageComponent[];
  seo: {
    metaTitle: LocaleMap | null;
    metaDescription: LocaleMap | null;
    ogImage: { publicUrl: string } | null;
  } | null;
}

interface PageProps {
  params: { locale: string };
}

async function getHomePage(locale: Locale, previewToken?: string): Promise<ApiPage | null> {
  const qs = previewToken ? `?previewToken=${previewToken}` : '';
  return apiFetch<ApiPage>(`/v1/public/pages/${locale}/${HOMEPAGE_SLUG[locale]}${qs}`, {
    next: { revalidate: 60 },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as Locale;
  const t = await getTranslations({ locale, namespace: 'common' });
  const page = await getHomePage(locale, undefined);

  const title = page?.seo?.metaTitle?.[locale]
    ?? (locale === 'tr' ? 'Siber Güvenlik Çözümleri | Krontech' : 'Cybersecurity Solutions | Krontech');
  const description = page?.seo?.metaDescription?.[locale]
    ?? (locale === 'tr'
      ? 'Krontech, PAM, DAM, DDM ve diğer siber güvenlik çözümleriyle işletmenizi korur.'
      : 'Krontech protects your business with PAM, DAM, DDM and other cybersecurity solutions.');

  return {
    title,
    description,
    alternates: {
      canonical: `https://krontech.com/${locale}`,
      languages: {
        tr: 'https://krontech.com/tr',
        en: 'https://krontech.com/en',
        'x-default': 'https://krontech.com/tr',
      },
    },
    openGraph: {
      title: 'Krontech — Cybersecurity Solutions',
      description: 'PAM, DAM, DDM and more.',
      type: 'website',
      url: `https://krontech.com/${locale}`,
      images: page?.seo?.ogImage ? [{ url: page.seo.ogImage.publicUrl }] : [],
    },
    twitter: { card: 'summary_large_image', title: 'Krontech' },
    other: { _t: t('home') },
  };
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Krontech',
  url: 'https://krontech.com',
  logo: 'https://krontech.com/assets/images/kt-dark-logo-en.png',
  sameAs: ['https://x.com/kron_tech', 'https://www.instagram.com/kron.tech/'],
};

const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Krontech',
  url: 'https://krontech.com',
};

export default async function HomePage({ params }: PageProps) {
  const locale = params.locale as Locale;
  setRequestLocale(locale);

  const { isEnabled } = draftMode();
  const previewToken = isEnabled ? (cookies().get('__preview_token')?.value) : undefined;
  const page = await getHomePage(locale, previewToken);

  return (
    <>
      <SeoHead jsonLd={organizationJsonLd} />
      <SeoHead jsonLd={webSiteJsonLd} />
      <div>
        {page?.components.map((section) => (
          <SectionRenderer key={section.id} section={section} locale={locale} />
        ))}
      </div>
    </>
  );
}
