import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithIntl } from '../../test/render';
import { BlogCard } from './BlogCard';
import type { BlogPost } from '@/fixtures/types';

vi.mock('next/image', () => ({
  default: ({ src, alt, fill: _fill, ...rest }: { src: string; alt: string; fill?: boolean; [key: string]: unknown }) => (
    <img src={src} alt={alt} {...rest} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

const blogPost: BlogPost = {
  id: 1,
  slug: { tr: 'test-blog', en: 'test-blog-en' },
  title: { tr: 'Test Blog Başlığı', en: 'Test Blog Title' },
  excerpt: { tr: 'Test özet metni.', en: 'Test excerpt text.' },
  body: { tr: 'Test içerik metni.', en: 'Test body text.' },
  category: 'blog',
  image: '/test-image.jpg',
  publishedAt: '2024-01-01',
};

const haberPost: BlogPost = {
  ...blogPost,
  id: 2,
  slug: { tr: 'test-haber', en: 'test-news' },
  title: { tr: 'Test Haber', en: 'Test News' },
  category: 'haber',
};

describe('BlogCard', () => {
  it('renders blue badge for blog category', () => {
    renderWithIntl(<BlogCard post={blogPost} locale="tr" />);
    const badge = screen.getByText('Blog');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-primary');
  });

  it('renders red badge for haber category', () => {
    renderWithIntl(<BlogCard post={haberPost} locale="tr" />);
    const badge = screen.getByText('Haber');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-error');
  });

  it('renders TR title when locale is tr', () => {
    renderWithIntl(<BlogCard post={blogPost} locale="tr" />);
    expect(screen.getByText('Test Blog Başlığı')).toBeInTheDocument();
  });

  it('renders EN title when locale is en', () => {
    renderWithIntl(<BlogCard post={blogPost} locale="en" />, 'en');
    expect(screen.getByText('Test Blog Title')).toBeInTheDocument();
  });

  it('links to correct slug path', () => {
    renderWithIntl(<BlogCard post={blogPost} locale="tr" />);
    const link = screen.getByRole('link', { name: /devamını oku/i });
    expect(link).toHaveAttribute('href', '/tr/blog/test-blog');
  });
});
