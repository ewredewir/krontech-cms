import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { blogPosts } from '@/fixtures/blog';
import { BlogCard } from '@/components/shared/BlogCard';
import { PageBanner } from '@/components/shared/PageBanner';
import { Breadcrumb } from '@/components/shared/Breadcrumb';

export const revalidate = 60;

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

  async function getPosts() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/public/blog/posts?locale=${locale}`,
        { next: { revalidate: 60 } }
      );
      if (!res.ok) return blogPosts;
      const data = await res.json() as unknown;
      return Array.isArray(data) ? data : blogPosts;
    } catch {
      return blogPosts;
    }
  }

  const posts = await getPosts();
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
