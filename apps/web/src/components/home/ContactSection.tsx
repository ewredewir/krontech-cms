import { getTranslations } from 'next-intl/server';
import { ContactForm } from '@/components/shared/ContactForm';
import type { Locale } from '@/lib/i18n';

interface ContactSectionProps {
  locale: Locale;
  backgroundImageUrl?: string;
}

export async function ContactSection({ locale, backgroundImageUrl }: ContactSectionProps) {
  const t = await getTranslations({ locale, namespace: 'contact' });

  return (
    <section
      aria-label={t('sectionLabel')}
      className="contact-section py-[110px] relative"
      style={{
        backgroundImage: `url('${backgroundImageUrl ?? '/assets/images/man-with-headphones.jpg'}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 nav:px-10">
        <div className="grid grid-cols-1 nav:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-white text-h3 font-bold mb-3">{t('sectionTitle')}</h2>
            <p className="text-white/80 text-lead">{t('sectionSubtitle')}</p>
          </div>
          <div className="dark-form">
            <ContactForm locale={locale} dark />
          </div>
        </div>
      </div>
    </section>
  );
}
