import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { HeroSlider } from '@/components/home/HeroSlider';
import { ProductCatalog } from '@/components/home/ProductCatalog';
import { KuppingerColeSection } from '@/components/home/KuppingerColeSection';
import { WhyKron } from '@/components/home/WhyKron';
import { StatsBanner } from '@/components/home/StatsBanner';
import { VideoSection } from '@/components/home/VideoSection';
import { BlogCarousel } from '@/components/home/BlogCarousel';
import { ContactSection } from '@/components/home/ContactSection';
import { SeoHead } from '@/components/shared/SeoHead';

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as Locale;
  const t = await getTranslations({ locale, namespace: 'common' });

  return {
    title: locale === 'tr' ? 'Siber Güvenlik Çözümleri | Krontech' : 'Cybersecurity Solutions | Krontech',
    description:
      locale === 'tr'
        ? 'Krontech, PAM, DAM, DDM ve diğer siber güvenlik çözümleriyle işletmenizi korur.'
        : 'Krontech protects your business with PAM, DAM, DDM and other cybersecurity solutions.',
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
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Krontech',
    },
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
  const marginTop = locale === 'en' ? '212px' : '156px';

  return (
    <>
      <SeoHead jsonLd={organizationJsonLd} />
      <SeoHead jsonLd={webSiteJsonLd} />
      <div style={{ marginTop }}>
        <HeroSlider locale={locale} />
        <ProductCatalog locale={locale} />
        <KuppingerColeSection locale={locale} />
        <WhyKron locale={locale} />
        <StatsBanner locale={locale} />
        <VideoSection locale={locale} />
        <BlogCarousel locale={locale} />
        <ContactSection locale={locale} />
      </div>
    </>
  );
}
