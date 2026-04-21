import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { products as fixtureProducts } from '@/fixtures/products';
import type { ProductCard } from '@/fixtures/types';
import { apiFetch } from '@/lib/api';
import { PageBanner } from '@/components/shared/PageBanner';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { SeoHead } from '@/components/shared/SeoHead';
import { BLUR_PLACEHOLDER } from '@/lib/media';

export const revalidate = 60;

interface ApiProductFeature {
  title: { tr: string; en: string };
  description: { tr: string; en: string };
}

interface ApiProduct {
  id: string;
  slug: { tr: string; en: string };
  name: { tr: string; en: string };
  tagline: { tr: string; en: string } | null;
  description: { tr: string; en: string } | null;
  features: ApiProductFeature[];
  media: Array<{ order: number; media: { publicUrl: string; altText: { tr: string; en: string } | null; blurDataUrl: string | null } }>;
}

function adaptProduct(p: ApiProduct, locale: Locale): ProductCard {
  return {
    id: p.id,
    slug: p.slug[locale],
    name: p.name,
    description: p.description ?? p.tagline ?? { tr: '', en: '' },
    bullets: (p.features ?? []).map((f) => f.title),
    image: p.media[0]?.media.publicUrl ?? BLUR_PLACEHOLDER,
    href: '',
    faqs: [],
  };
}

interface PageProps {
  params: { locale: string; slug: string };
}

export async function generateStaticParams() {
  const apiSlugs = await apiFetch<Array<{ slug: { tr: string; en: string } }>>(
    '/v1/public/products/all-slugs',
  );
  const slugMaps = apiSlugs ?? fixtureProducts.map((p) => ({ slug: { tr: p.slug, en: p.slug } }));
  return locales.flatMap((locale) =>
    slugMaps
      .map((item) => ({ locale, slug: item.slug[locale as Locale] }))
      .filter((p) => Boolean(p.slug)),
  );
}

async function getProduct(locale: Locale, slug: string): Promise<ProductCard | null> {
  const data = await apiFetch<ApiProduct>(
    `/v1/public/products/${locale}/${slug}`,
    { next: { revalidate: 60 } },
  );
  if (data) return adaptProduct(data, locale);
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as Locale;
  const product = await getProduct(locale, params.slug);
  if (!product) return { title: 'Not Found' };

  return {
    title: product.name[locale],
    description: product.description[locale],
    alternates: {
      canonical: `https://krontech.com/${locale}/products/${params.slug}`,
      languages: {
        tr: `https://krontech.com/tr/products/${params.slug}`,
        en: `https://krontech.com/en/products/${params.slug}`,
      },
    },
    openGraph: {
      title: product.name[locale],
      description: product.description[locale],
      type: 'website',
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const locale = params.locale as Locale;
  setRequestLocale(locale);
  const product = await getProduct(locale, params.slug);
  if (!product) notFound();

  const t = await getTranslations({ locale, namespace: 'products' });
  const commonT = await getTranslations({ locale, namespace: 'common' });

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name[locale],
    description: product.description[locale],
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'All',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  const faqJsonLd = product.faqs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: product.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question[locale],
          acceptedAnswer: { '@type': 'Answer', text: faq.answer[locale] },
        })),
      }
    : null;

  return (
    <>
      <SeoHead jsonLd={productJsonLd} />
      {faqJsonLd && <SeoHead jsonLd={faqJsonLd} />}
      <PageBanner title={product.name[locale]} bgImage={product.image} />
      <Breadcrumb
        locale={locale}
        items={[
          { label: t('sectionTitle'), href: `/${locale}/products` },
          { label: product.name[locale] },
        ]}
      />
      <div className="max-w-[1400px] mx-auto px-6 nav:px-10 py-12">
        <div className="grid grid-cols-1 nav:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h1 className="text-heading text-h1 font-semibold mb-4">{product.name[locale]}</h1>
            <p className="text-secondary-text text-lead leading-7 mb-6">{product.description[locale]}</p>
            {product.bullets.length > 0 && (
              <ul className="check-list mb-6">
                {product.bullets.map((bullet, i) => (
                  <li key={i} className="text-secondary-text text-body">{bullet[locale]}</li>
                ))}
              </ul>
            )}
            <Link
              href={`/${locale}/${locale === 'tr' ? 'iletisim' : 'contact'}`}
              className="inline-block bg-primary hover:bg-primary-light text-white font-medium px-8 py-3 text-sm transition-colors"
            >
              {commonT('learnMore')}
            </Link>
          </div>
          <div className="relative h-80">
            <Image
              src={product.image}
              alt={product.name[locale]}
              fill
              className="object-contain"
              priority
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              sizes="(max-width: 1100px) 100vw, 50vw"
            />
          </div>
        </div>

        {product.faqs.length > 0 && (
          <section aria-label="FAQ" className="mb-12">
            <h2 className="text-heading text-h3 font-bold mb-8">
              {locale === 'tr' ? 'Sık Sorulan Sorular' : 'Frequently Asked Questions'}
            </h2>
            <dl className="space-y-4">
              {product.faqs.map((faq, i) => (
                <details key={i} className="bg-white shadow-card p-6">
                  <summary className="font-semibold text-heading cursor-pointer list-none flex justify-between items-center">
                    {faq.question[locale]}
                    <span aria-hidden="true" className="text-primary text-xl ml-4">+</span>
                  </summary>
                  <dd className="mt-4 text-secondary-text text-body leading-7">
                    {faq.answer[locale]}
                  </dd>
                </details>
              ))}
            </dl>
          </section>
        )}

        <Link
          href={`/${locale}/products`}
          className="text-primary text-nav-sm font-medium hover:text-primary-light transition-colors"
        >
          ← {commonT('backToProducts')}
        </Link>
      </div>
    </>
  );
}
