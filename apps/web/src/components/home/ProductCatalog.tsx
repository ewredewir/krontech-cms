import dynamic from 'next/dynamic';
import { unstable_noStore as noStore } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { ProductCard } from '@/fixtures/types';
import { apiFetch } from '@/lib/api';
import { BLUR_PLACEHOLDER } from '@/lib/media';

const ProductSwiperInner = dynamic(() => import('./ProductSwiperInner'), { ssr: false });

interface ApiProduct {
  id: string;
  slug: { tr: string; en: string };
  name: { tr: string; en: string };
  tagline: { tr: string; en: string } | null;
  description: { tr: string; en: string } | null;
  media: Array<{ order: number; media: { publicUrl: string } }>;
}

function adaptProduct(p: ApiProduct, locale: Locale): ProductCard {
  return {
    id: p.id,
    slug: p.slug[locale],
    name: p.name,
    description: p.tagline ?? p.description ?? { tr: '', en: '' },
    bullets: [],
    image: p.media[0]?.media.publicUrl ?? BLUR_PLACEHOLDER,
    href: '',
    faqs: [],
  };
}

interface ProductCatalogProps {
  locale: Locale;
}

export async function ProductCatalog({ locale }: ProductCatalogProps) {
  const t = await getTranslations({ locale, namespace: 'products' });

  const apiProducts = await apiFetch<ApiProduct[]>(
    `/v1/public/products/${locale}`,
    { next: { revalidate: 60 } },
  );
  if (apiProducts === null) noStore();
  if (!apiProducts || apiProducts.length === 0) return null;
  const products: ProductCard[] = apiProducts.map((p) => adaptProduct(p, locale));

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
        <ProductSwiperInner products={products} locale={locale} />
      </div>
    </section>
  );
}
