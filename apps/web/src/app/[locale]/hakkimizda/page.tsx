import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { PageBanner } from '@/components/shared/PageBanner';
import { Breadcrumb } from '@/components/shared/Breadcrumb';

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as Locale;
  const t = await getTranslations({ locale, namespace: 'about' });
  return {
    title: t('sectionTitle'),
    alternates: {
      canonical: `https://krontech.com/tr/hakkimizda`,
      languages: {
        tr: 'https://krontech.com/tr/hakkimizda',
        en: 'https://krontech.com/en/about-us',
      },
    },
  };
}

export default async function AboutTrPage({ params }: PageProps) {
  const locale = params.locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about' });

  return (
    <>
      <PageBanner title={t('sectionTitle')} />
      <Breadcrumb locale={locale} items={[{ label: t('sectionTitle') }]} />
      <div className="max-w-[1400px] mx-auto px-6 nav:px-10 py-12">
        <div className="max-w-3xl">
          <h1 className="text-heading text-h1 font-semibold mb-4">{t('sectionTitle')}</h1>
          <p className="text-secondary-text text-lead leading-7 mb-8">{t('subtitle')}</p>
          <div className="grid grid-cols-1 nav:grid-cols-3 gap-6">
            {(['mission', 'vision', 'values'] as const).map((key) => (
              <section key={key} aria-label={t(key)} className="bg-white shadow-card p-6">
                <h2 className="text-primary font-semibold mb-3">{t(key)}</h2>
                <p className="text-secondary-text text-body">
                  {key === 'mission' && (locale === 'tr'
                    ? 'Kuruluşları siber tehditlerden koruyarak dijital dönüşümlerini güvenle tamamlamalarına yardımcı olmak.'
                    : 'Helping organizations complete their digital transformation securely by protecting them from cyber threats.')}
                  {key === 'vision' && (locale === 'tr'
                    ? 'Küresel ölçekte tanınan, yerli ve milli bir siber güvenlik şirketi olmak.'
                    : 'To become a globally recognized domestic cybersecurity company.')}
                  {key === 'values' && (locale === 'tr'
                    ? 'Dürüstlük, yenilikçilik, müşteri odaklılık ve sürekli gelişim.'
                    : 'Integrity, innovation, customer focus, and continuous improvement.')}
                </p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
