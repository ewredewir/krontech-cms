import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { BLUR_PLACEHOLDER } from '@/lib/media';
import type { Locale } from '@/lib/i18n';

interface CmsStat {
  label: { tr: string; en: string };
  value: string;
}

// Hardcoded icons paired by position — kept as UI decoration
const STAT_ICONS = [
  '/assets/uploads/icons/globe.png',
  '/assets/uploads/icons/country.jpg',
  '/assets/uploads/icons/partners.png',
  '/assets/uploads/icons/projects.png',
];

interface StatsBannerProps {
  locale: Locale;
  stats: CmsStat[];
}

export async function StatsBanner({ locale, stats }: StatsBannerProps) {
  const t = await getTranslations({ locale, namespace: 'stats' });

  return (
    <section
      aria-label={t('sectionLabel')}
      className="py-16 bg-primary mb-24"
    >
      <div className="max-w-[1400px] mx-auto px-6 nav:px-10">
        <h2 className="text-center text-white text-h2 font-medium mb-10">
          {t('sectionTitle')}
        </h2>
        <ul className="grid grid-cols-2 nav:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <li key={i} className="flex flex-col items-center text-center">
              {STAT_ICONS[i] && (
                <div className="relative w-16 h-16 mb-3">
                  <Image
                    src={STAT_ICONS[i]!}
                    alt=""
                    fill
                    className="object-contain"
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                    sizes="64px"
                  />
                </div>
              )}
              <span className="text-white text-3xl font-bold">{stat.value}</span>
              <span className="text-white/80 text-sm mt-1">{stat.label[locale]}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
