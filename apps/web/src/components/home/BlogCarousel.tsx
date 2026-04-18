import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { blogPosts as fixturePosts } from '@/fixtures/blog';
import type { BlogPost } from '@/fixtures/types';
import { apiFetch } from '@/lib/api';
import { BLUR_PLACEHOLDER } from '@/lib/media';

const BlogSwiperInner = dynamic(() => import('./BlogSwiperInner'), { ssr: false });

interface ApiBlogPost {
  id: string;
  slug: { tr: string; en: string };
  title: { tr: string; en: string };
  excerpt: { tr: string; en: string };
  publishedAt: string | null;
  category: { slug: string } | null;
  featuredImage: { publicUrl: string } | null;
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

interface BlogCarouselProps {
  locale: Locale;
}

export async function BlogCarousel({ locale }: BlogCarouselProps) {
  const t = await getTranslations({ locale, namespace: 'blog' });

  const apiPosts = await apiFetch<ApiBlogPost[]>(
    `/v1/public/blog/posts/${locale}`,
    { next: { revalidate: 60 } },
  );
  const posts: BlogPost[] =
    Array.isArray(apiPosts) && apiPosts.length > 0
      ? apiPosts.map(adaptPost)
      : fixturePosts;

  return (
    <section aria-label={t('sectionLabel')} className="py-20 bg-body mb-24">
      <div className="max-w-[1400px] mx-auto px-6 nav:px-10">
        <div className="text-center mb-12">
          <h2 className="text-h2 text-heading font-medium">{t('sectionTitle')}</h2>
        </div>
        <BlogSwiperInner posts={posts} locale={locale} />
      </div>
    </section>
  );
}
