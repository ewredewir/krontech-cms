import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { BLUR_PLACEHOLDER } from '@/lib/media';

interface KuppingerColeSectionProps {
  locale: Locale;
  heading?: { tr: string; en: string };
  linkHref?: string;
  badgeImageUrl?: string;
}

export async function KuppingerColeSection({ locale, heading, linkHref, badgeImageUrl }: KuppingerColeSectionProps) {
  const t = await getTranslations({ locale, namespace: 'kuppingercole' });

  return (
    <section aria-label={t('sectionLabel')} className="py-20 bg-body mb-24">
      <div className="max-w-[1400px] mx-auto px-6 nav:px-10">
        <div className="grid grid-cols-1 nav:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-primary text-white text-xs font-semibold px-3 py-1 mb-4">
              {t('badge')}
            </span>
            <h2 className="text-h3 text-heading mb-4">{heading?.[locale] ?? t('title')}</h2>
            <p className="text-secondary-text text-lead leading-7 mb-6">{t('body')}</p>
            <Link
              href={linkHref ?? `/${locale}/resources`}
              className="inline-block bg-primary hover:bg-primary-light text-white font-medium px-8 py-3 text-sm transition-colors"
            >
              {t('cta')}
            </Link>
          </div>
          {badgeImageUrl && (
            <div className="flex justify-center">
              <Image
                src={badgeImageUrl}
                alt="KuppingerCole Leadership Compass PAM Overall Leader"
                width={500}
                height={400}
                className="object-contain max-w-full"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                sizes="(max-width: 1100px) 100vw, 50vw"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
