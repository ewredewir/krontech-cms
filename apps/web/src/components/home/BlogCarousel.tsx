'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n';

const BlogSwiperInner = dynamic(() => import('./BlogSwiperInner'), { ssr: false });

interface BlogCarouselProps {
  locale: Locale;
}

export function BlogCarousel({ locale }: BlogCarouselProps) {
  const t = useTranslations('blog');

  return (
    <section aria-label={t('sectionLabel')} className="py-20 bg-body mb-24">
      <div className="max-w-[1400px] mx-auto px-6 nav:px-10">
        <div className="text-center mb-12">
          <h2 className="text-h2 text-heading font-medium">{t('sectionTitle')}</h2>
        </div>
        <BlogSwiperInner locale={locale} />
      </div>
    </section>
  );
}
