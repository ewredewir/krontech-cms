import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { products } from '@/fixtures/products';
import { PageBanner } from '@/components/shared/PageBanner';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { SeoHead } from '@/components/shared/SeoHead';
import { BLUR_PLACEHOLDER } from '@/lib/media';
import type { ProductCard } from '@/fixtures/types';

export const revalidate = 60;

interface PageProps {
  params: { locale: string; slug: string };
}

export async function generateStaticParams() {
  return locales.flatMap((locale) =>
    products.map((product) => ({ locale, slug: product.slug }))
  );
}

async function getProduct(slug: string): Promise<ProductCard | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/public/products/${slug}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error('not found');
    return await res.json() as ProductCard;
  } catch {
    return products.find((p) => p.slug === slug) ?? null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as Locale;
  const product = await getProduct(params.slug);
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
  const product = await getProduct(params.slug);
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

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: product.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question[locale],
      acceptedAnswer: { '@type': 'Answer', text: faq.answer[locale] },
    })),
  };

  return (
    <>
      <SeoHead jsonLd={productJsonLd} />
      <SeoHead jsonLd={faqJsonLd} />
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
            <ul className="check-list mb-6">
              {product.bullets.map((bullet, i) => (
                <li key={i} className="text-secondary-text text-body">{bullet[locale]}</li>
              ))}
            </ul>
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
