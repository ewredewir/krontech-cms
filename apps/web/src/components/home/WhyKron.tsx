import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';

interface WhyKronProps {
  locale: Locale;
}

export async function WhyKron({ locale }: WhyKronProps) {
  const t = await getTranslations({ locale, namespace: 'whyKron' });

  const reasons = [
    { title: t('reason1Title'), body: t('reason1Body') },
    { title: t('reason2Title'), body: t('reason2Body') },
    { title: t('reason3Title'), body: t('reason3Body') },
    { title: t('reason4Title'), body: t('reason4Body') },
  ];

  return (
    <section
      aria-label={t('sectionLabel')}
      className="py-20 mb-24"
      style={{ background: 'linear-gradient(135deg, #1596FF 0%, #1563FF 100%)' }}
    >
      <div className="max-w-[1400px] mx-auto px-6 nav:px-10">
        <div className="grid grid-cols-1 nav:grid-cols-2 gap-12 items-start">
          <div className="bg-white p-10 shadow-card">
            <h2 className="text-h3 text-heading mb-2">{t('title')}</h2>
            <p className="text-secondary-text mb-8">{t('subtitle')}</p>
            <dl className="space-y-6">
              {reasons.map((reason, i) => (
                <div key={i}>
                  <dt className="font-semibold text-heading mb-1">{reason.title}</dt>
                  <dd className="text-secondary-text text-body">{reason.body}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-col justify-center text-white">
            <h3 className="text-2xl font-semibold mb-4">KuppingerCole &amp; Gartner</h3>
            <p className="text-white/80 text-lead leading-7 mb-6">
              Krontech ürünleri, bağımsız analiz şirketleri tarafından düzenli olarak değerlendirilmekte ve lider konumunda yer almaktadır.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                'Overall Leader',
                'Innovation Leader',
                'Product Leader',
                'Market Leader',
              ].map((badge) => (
                <div
                  key={badge}
                  className="border border-white/30 px-4 py-3 text-center text-sm font-medium text-white"
                >
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
