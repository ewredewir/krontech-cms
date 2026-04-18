import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { BLUR_PLACEHOLDER } from '@/lib/media';

interface StatsBannerProps {
  locale: string;
}

export async function StatsBanner({ locale }: StatsBannerProps) {
  const t = await getTranslations({ locale, namespace: 'stats' });

  const stats = [
    {
      icon: '/assets/uploads/icons/globe.png',
      value: t('continentsValue'),
      label: t('continents'),
    },
    {
      icon: '/assets/uploads/icons/country.jpg',
      value: t('countriesValue'),
      label: t('countries'),
    },
    {
      icon: '/assets/uploads/icons/partners.png',
      value: t('partnersValue'),
      label: t('partners'),
    },
    {
      icon: '/assets/uploads/icons/projects.png',
      value: t('projectsValue'),
      label: t('projects'),
    },
  ];

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
          {stats.map((stat) => (
            <li key={stat.label} className="flex flex-col items-center text-center">
              <div className="relative w-16 h-16 mb-3">
                <Image
                  src={stat.icon}
                  alt=""
                  fill
                  className="object-contain"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  sizes="64px"
                />
              </div>
              <span className="text-white text-3xl font-bold">{stat.value}</span>
              <span className="text-white/80 text-sm mt-1">{stat.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
