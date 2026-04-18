import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { products as fixtureProducts } from '@/fixtures/products';
import type { ProductCard } from '@/fixtures/types';
import { apiFetch } from '@/lib/api';
import { PageBanner } from '@/components/shared/PageBanner';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { BLUR_PLACEHOLDER } from '@/lib/media';

export const revalidate = 60;

interface ApiProduct {
  id: string;
  slug: { tr: string; en: string };
  name: { tr: string; en: string };
  tagline: { tr: string; en: string } | null;
  description: { tr: string; en: string } | null;
  media: Array<{ order: number; media: { publicUrl: string; altText: { tr: string; en: string } | null; blurDataUrl: string | null } }>;
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

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as Locale;
  return {
    title: locale === 'tr' ? 'Ürünler' : 'Products',
    alternates: {
      canonical: `https://krontech.com/${locale}/products`,
      languages: {
        tr: 'https://krontech.com/tr/products',
        en: 'https://krontech.com/en/products',
      },
    },
  };
}

export default async function ProductsPage({ params }: PageProps) {
  const locale = params.locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'products' });

  const apiProducts = await apiFetch<ApiProduct[]>(
    `/v1/public/products/${locale}`,
    { next: { revalidate: 60 } },
  );
  const products: ProductCard[] =
    Array.isArray(apiProducts) && apiProducts.length > 0
      ? apiProducts.map((p) => adaptProduct(p, locale))
      : fixtureProducts;

  return (
    <>
      <PageBanner title={t('sectionTitle')} />
      <Breadcrumb locale={locale} items={[{ label: t('sectionTitle') }]} />
      <div className="max-w-[1400px] mx-auto px-6 nav:px-10 py-12">
        <div className="grid grid-cols-1 nav:grid-cols-3 gap-8">
          {products.map((product) => (
            <article key={product.id} className="bg-white shadow-card flex flex-col">
              <div className="relative h-48">
                <Image
                  src={product.image}
                  alt={product.name[locale]}
                  fill
                  className="object-contain p-4"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  sizes="(max-width: 1100px) 100vw, 33vw"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h2 className="text-heading font-semibold text-lg mb-2">{product.name[locale]}</h2>
                <p className="text-secondary-text text-body flex-1 mb-4">{product.description[locale]}</p>
                <Link
                  href={`/${locale}/products/${product.slug}`}
                  className="text-primary text-nav-sm font-medium hover:text-primary-light transition-colors border-t border-gray-100 pt-4"
                >
                  {t('learnMore')} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
