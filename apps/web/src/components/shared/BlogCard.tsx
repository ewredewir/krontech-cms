import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { BlogPost } from '@/types';
import type { Locale } from '@/lib/i18n';
import { BLUR_PLACEHOLDER } from '@/lib/media';

interface BlogCardProps {
  post: BlogPost;
  locale: Locale;
  featured?: boolean;
}

export function BlogCard({ post, locale, featured }: BlogCardProps) {
  const t = useTranslations('blog');

  const badgeColor =
    post.category === 'blog'
      ? 'bg-primary text-white'
      : 'bg-error text-white';

  const badgeLabel =
    post.category === 'blog' ? t('blogBadge') : t('haberBadge');

  return (
    <article
      className={`bg-white shadow-card flex flex-col ${featured ? 'h-full' : ''}`}
    >
      <div className={`relative overflow-hidden ${featured ? 'h-64' : 'h-48'}`}>
        <Image
          src={post.image}
          alt={post.title[locale]}
          fill
          className="object-cover"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          sizes={featured ? '(max-width: 1100px) 100vw, 66vw' : '(max-width: 1100px) 100vw, 33vw'}
        />
        <span
          className={`absolute left-[10px] top-[10px] text-xs font-semibold px-2 py-1 ${badgeColor}`}
          aria-label={`Category: ${badgeLabel}`}
        >
          {badgeLabel}
        </span>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <time
          dateTime={post.publishedAt}
          className="text-xs text-secondary-text mb-2"
        >
          {new Date(post.publishedAt).toLocaleDateString(
            locale === 'tr' ? 'tr-TR' : 'en-US',
            { day: 'numeric', month: 'long', year: 'numeric' }
          )}
        </time>
        <h3 className={`text-heading font-semibold mb-2 ${featured ? 'text-xl' : 'text-base'}`}>
          {post.title[locale]}
        </h3>
        <p className="text-secondary-text text-body flex-1">{post.excerpt[locale]}</p>
        <Link
          href={`/${locale}/blog/${post.slug[locale]}`}
          className="mt-4 text-primary text-nav-sm font-medium hover:text-primary-light transition-colors"
        >
          {t('readMore')} →
        </Link>
      </div>
    </article>
  );
}
