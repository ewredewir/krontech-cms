import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { ContactForm } from '@/components/shared/ContactForm';
import { PageBanner } from '@/components/shared/PageBanner';
import { Breadcrumb } from '@/components/shared/Breadcrumb';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as Locale;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return {
    title: t('sectionTitle'),
    alternates: {
      canonical: `https://krontech.com/en/contact`,
      languages: {
        tr: 'https://krontech.com/tr/iletisim',
        en: 'https://krontech.com/en/contact',
      },
    },
  };
}

export default async function ContactEnPage({ params }: PageProps) {
  const locale = params.locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'contact' });

  return (
    <>
      <PageBanner title={t('sectionTitle')} />
      <Breadcrumb locale={locale} items={[{ label: t('sectionTitle') }]} />
      <div className="max-w-[1400px] mx-auto px-6 nav:px-10 py-12">
        <div className="max-w-[920px] mx-auto bg-white shadow-card p-10">
          <h1 className="text-heading text-h1 font-semibold mb-2">{t('sectionTitle')}</h1>
          <p className="text-secondary-text mb-8">{t('sectionSubtitle')}</p>
          <ContactForm locale={locale} />
        </div>
      </div>
    </>
  );
}
