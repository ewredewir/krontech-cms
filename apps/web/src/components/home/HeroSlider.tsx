'use client';

import dynamic from 'next/dynamic';
import type { Locale } from '@/lib/i18n';
import { useTranslations } from 'next-intl';

// @deprecated fixtures/slides — data now comes from CMS via props
export interface CmsSlide {
  heading: { tr: string; en: string };
  subheading?: { tr: string; en: string };
  ctaLabel?: { tr: string; en: string };
  ctaUrl?: string;
  backgroundImageUrl?: string;
  backgroundBlurDataUrl?: string;
}

const SwiperComponent = dynamic(() => import('./HeroSwiperInner'), { ssr: false });

interface HeroSliderProps {
  locale: Locale;
  slides: CmsSlide[];
}

export function HeroSlider({ locale, slides }: HeroSliderProps) {
  const t = useTranslations('hero');

  return (
    <section
      aria-label={t('sectionLabel')}
      className="w-full bg-black overflow-hidden"
      style={{ height: '100vh', minHeight: '400px' }}
    >
      <SwiperComponent locale={locale} slides={slides} />
    </section>
  );
}
