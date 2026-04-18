import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { PageBanner } from '@/components/shared/PageBanner';
import { Breadcrumb } from '@/components/shared/Breadcrumb';

export const revalidate = 300;

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as Locale;
  const t = await getTranslations({ locale, namespace: 'resources' });
  return {
    title: t('sectionTitle'),
    description: t('subtitle'),
    alternates: {
      canonical: `https://krontech.com/${locale}/resources`,
      languages: {
        tr: 'https://krontech.com/tr/resources',
        en: 'https://krontech.com/en/resources',
      },
    },
  };
}

export default async function ResourcesPage({ params }: PageProps) {
  const locale = params.locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'resources' });

  const categories = [
    { key: 'whitepapers' as const, label: t('whitepapers'), count: 8 },
    { key: 'caseStudies' as const, label: t('caseStudies'), count: 5 },
    { key: 'datasheets' as const, label: t('datasheets'), count: 12 },
  ] as const;

  return (
    <>
      <PageBanner title={t('sectionTitle')} />
      <Breadcrumb locale={locale} items={[{ label: t('sectionTitle') }]} />
      <div className="max-w-[1400px] mx-auto px-6 nav:px-10 py-12">
        <p className="text-secondary-text text-lead mb-10">{t('subtitle')}</p>
        <div className="grid grid-cols-1 nav:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <section key={cat.key} aria-label={cat.label} className="bg-white shadow-card p-8">
              <h2 className="text-heading font-semibold text-xl mb-4">{cat.label}</h2>
              <p className="text-secondary-text text-body mb-4">
                {cat.count} {locale === 'tr' ? 'belge mevcut' : 'documents available'}
              </p>
              <button
                className="text-primary text-nav-sm font-medium hover:text-primary-light transition-colors"
                aria-label={`${t('download')} ${cat.label}`}
              >
                {t('download')} →
              </button>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
