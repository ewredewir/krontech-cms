import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { blogPosts as fixturePosts } from '@/fixtures/blog';
import type { BlogPost } from '@/fixtures/types';
import { apiFetch } from '@/lib/api';
import { BlogCard } from '@/components/shared/BlogCard';
import { PageBanner } from '@/components/shared/PageBanner';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { BLUR_PLACEHOLDER } from '@/lib/media';

export const revalidate = 60;

interface ApiBlogPost {
  id: string;
  slug: { tr: string; en: string };
  title: { tr: string; en: string };
  excerpt: { tr: string; en: string };
  publishedAt: string | null;
  category: { slug: string; name: { tr: string; en: string } } | null;
  featuredImage: { publicUrl: string; altText: { tr: string; en: string } | null; blurDataUrl: string | null } | null;
}

function adaptPost(p: ApiBlogPost): BlogPost {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category?.slug === 'haber' ? 'haber' : 'blog',
    image: p.featuredImage?.publicUrl ?? BLUR_PLACEHOLDER,
    publishedAt: p.publishedAt ?? new Date().toISOString(),
  };
}

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as Locale;
  const t = await getTranslations({ locale, namespace: 'blog' });

  return {
    title: t('sectionTitle'),
    description: locale === 'tr' ? 'Krontech blog yazıları ve haberler' : 'Krontech blog posts and news',
    alternates: {
      canonical: `https://krontech.com/${locale}/blog`,
      languages: {
        tr: 'https://krontech.com/tr/blog',
        en: 'https://krontech.com/en/blog',
      },
    },
  };
}

export default async function BlogListPage({ params }: PageProps) {
  const locale = params.locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'blog' });

  const apiPosts = await apiFetch<ApiBlogPost[]>(
    `/v1/public/blog/posts/${locale}`,
    { next: { revalidate: 60 } },
  );
  const posts: BlogPost[] =
    Array.isArray(apiPosts) && apiPosts.length > 0
      ? apiPosts.map(adaptPost)
      : fixturePosts;

  const [featured, ...rest] = posts;

  return (
    <>
      <PageBanner title={t('sectionTitle')} />
      <Breadcrumb locale={locale} items={[{ label: t('sectionTitle') }]} />
      <div className="max-w-[1400px] mx-auto px-6 nav:px-10 py-12">
        <div className="grid grid-cols-1 nav:grid-cols-3 gap-8 mb-12">
          <div className="nav:col-span-2">
            {featured && <BlogCard post={featured} locale={locale} featured />}
          </div>
          <aside aria-label={t('featuredTitle')}>
            <h2 className="text-heading font-semibold text-lg mb-4 pb-2 border-b-2 border-primary">
              {t('featuredTitle')}
            </h2>
            <div className="flex flex-col gap-4">
              {posts.slice(1, 4).map((post) => (
                <BlogCard key={post.id} post={post} locale={locale} />
              ))}
            </div>
          </aside>
        </div>

        <h2 className="text-heading font-semibold text-xl mb-6">{t('allPosts')}</h2>
        <div className="grid grid-cols-1 nav:grid-cols-3 gap-8">
          {rest.map((post) => (
            <BlogCard key={post.id} post={post} locale={locale} />
          ))}
        </div>
      </div>
    </>
  );
}
