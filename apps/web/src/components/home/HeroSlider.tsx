'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { slides } from '@/fixtures/slides';
import type { Locale } from '@/lib/i18n';
import { BLUR_PLACEHOLDER } from '@/lib/media';
import { useTranslations } from 'next-intl';

const SwiperComponent = dynamic(() => import('./HeroSwiperInner'), { ssr: false });

interface HeroSliderProps {
  locale: Locale;
}

export function HeroSlider({ locale }: HeroSliderProps) {
  const t = useTranslations('hero');

  return (
    <section
      aria-label={t('sectionLabel')}
      className="w-full bg-black overflow-hidden"
      style={{ height: 'calc(100vh - 156px)', minHeight: '400px' }}
    >
      <SwiperComponent locale={locale} />
    </section>
  );
}
