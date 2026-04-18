'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { products } from '@/fixtures/products';
import type { Locale } from '@/lib/i18n';

const ProductSwiperInner = dynamic(() => import('./ProductSwiperInner'), { ssr: false });

interface ProductCatalogProps {
  locale: Locale;
}

export function ProductCatalog({ locale }: ProductCatalogProps) {
  const t = useTranslations('products');

  return (
    <section
      aria-label={t('sectionLabel')}
      className="py-20 bg-white"
    >
      <div className="max-w-[1400px] mx-auto px-6 nav:px-10">
        <div className="text-center mb-12">
          <h2 className="text-h2 text-heading font-medium">{t('sectionTitle')}</h2>
          <p className="text-secondary-text mt-2">{t('sectionSubtitle')}</p>
        </div>
        <ProductSwiperInner locale={locale} />
      </div>
    </section>
  );
}
