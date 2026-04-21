import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { blogPosts as fixturePosts } from '@/fixtures/blog';
import type { BlogPost } from '@/fixtures/types';
import { apiFetch } from '@/lib/api';
import { PageBanner } from '@/components/shared/PageBanner';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { SeoHead } from '@/components/shared/SeoHead';
import { BLUR_PLACEHOLDER } from '@/lib/media';

export const revalidate = 60;

interface ApiBlogPost {
  id: string;
  slug: { tr: string; en: string };
  title: { tr: string; en: string };
  excerpt: { tr: string; en: string };
  body: { tr: string; en: string } | null;
  publishedAt: string | null;
  category: { slug: string } | null;
  featuredImage: { publicUrl: string; altText: { tr: string; en: string } | null; blurDataUrl: string | null } | null;
}

function adaptPost(p: ApiBlogPost): BlogPost {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    body: p.body ?? { tr: '', en: '' },
    category: p.category?.slug === 'haber' ? 'haber' : 'blog',
    image: p.featuredImage?.publicUrl ?? BLUR_PLACEHOLDER,
    publishedAt: p.publishedAt ?? new Date().toISOString(),
  };
}

interface PageProps {
  params: { locale: string; slug: string };
}

export async function generateStaticParams() {
  const apiSlugs = await apiFetch<Array<{ slug: { tr: string; en: string } }>>(
    '/v1/public/blog/posts/all-slugs',
  );
  const slugMaps = apiSlugs ?? fixturePosts.map((p) => ({ slug: p.slug }));
  return locales.flatMap((locale) =>
    slugMaps
      .map((item) => ({ locale, slug: item.slug[locale] }))
      .filter((p) => Boolean(p.slug)),
  );
}

async function getPost(locale: Locale, slug: string): Promise<BlogPost | null> {
  const data = await apiFetch<ApiBlogPost>(
    `/v1/public/blog/posts/${locale}/${slug}`,
    { next: { revalidate: 60 } },
  );
  if (data) return adaptPost(data);
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as Locale;
  const post = await getPost(locale, params.slug);
  if (!post) return { title: 'Not Found' };

  return {
    title: post.title[locale],
    description: post.excerpt[locale],
    alternates: {
      canonical: `https://krontech.com/${locale}/blog/${params.slug}`,
      languages: {
        tr: `https://krontech.com/tr/blog/${post.slug.tr}`,
        en: `https://krontech.com/en/blog/${post.slug.en}`,
      },
    },
    openGraph: {
      title: post.title[locale],
      description: post.excerpt[locale],
      type: 'article',
      images: [{ url: post.image }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title[locale],
    },
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const locale = params.locale as Locale;
  setRequestLocale(locale);
  const post = await getPost(locale, params.slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: 'blog' });
  const commonT = await getTranslations({ locale, namespace: 'common' });

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title[locale],
    description: post.excerpt[locale],
    image: post.image,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: 'Krontech' },
    publisher: { '@type': 'Organization', name: 'Krontech' },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Krontech', item: 'https://krontech.com' },
      { '@type': 'ListItem', position: 2, name: t('sectionTitle'), item: `https://krontech.com/${locale}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title[locale] },
    ],
  };

  return (
    <>
      <SeoHead jsonLd={articleJsonLd} />
      <SeoHead jsonLd={breadcrumbJsonLd} />
      <PageBanner title={post.title[locale]} bgImage={post.image} />
      <Breadcrumb
        locale={locale}
        items={[
          { label: t('sectionTitle'), href: `/${locale}/blog` },
          { label: post.title[locale] },
        ]}
      />
      <div className="max-w-[1400px] mx-auto px-6 nav:px-10 py-12">
        <article className="max-w-3xl">
          <div className="relative w-full h-64 nav:h-96 mb-8">
            <Image
              src={post.image}
              alt={post.title[locale]}
              fill
              className="object-cover"
              priority
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              sizes="(max-width: 1100px) 100vw, 768px"
            />
          </div>
          <time dateTime={post.publishedAt} className="text-secondary-text text-sm">
            {new Date(post.publishedAt).toLocaleDateString(
              locale === 'tr' ? 'tr-TR' : 'en-US',
              { day: 'numeric', month: 'long', year: 'numeric' }
            )}
          </time>
          <h1 className="text-heading text-h1 font-semibold mt-2 mb-4">{post.title[locale]}</h1>
          <p className="text-secondary-text text-lead leading-7 mb-6">{post.excerpt[locale]}</p>
          <div className="text-secondary-text text-body leading-7 whitespace-pre-wrap">
            {post.body[locale]}
          </div>
          <div className="mt-8">
            <Link
              href={`/${locale}/blog`}
              className="text-primary text-nav-sm font-medium hover:text-primary-light transition-colors"
            >
              ← {commonT('backToBlog')}
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
