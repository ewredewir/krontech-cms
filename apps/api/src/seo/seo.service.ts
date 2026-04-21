import { Injectable } from '@nestjs/common';
import {
  BlogPost,
  Media,
  Page,
  PageComponent,
  Prisma,
  Product,
  SeoMeta,
  User,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { UpdateSeoMetaDto } from '@krontech/types';

type LocaleMap = { tr: string; en: string };

@Injectable()
export class SeoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async upsertForPage(pageId: string, dto: UpdateSeoMetaDto): Promise<SeoMeta> {
    const page = await this.prisma.page.findUniqueOrThrow({
      where: { id: pageId },
      include: { seo: true },
    });

    let seo: SeoMeta;
    if (page.seo) {
      seo = await this.prisma.seoMeta.update({
        where: { id: page.seo.id },
        data: dto as Prisma.SeoMetaUpdateInput,
      });
    } else {
      seo = await this.prisma.seoMeta.create({
        data: dto as Prisma.SeoMetaCreateInput,
      });
      await this.prisma.page.update({
        where: { id: pageId },
        data: { seoMetaId: seo.id },
      });
    }

    if (page.status === 'PUBLISHED') {
      const slug = page.slug as LocaleMap;
      const paths = [`/tr/${slug.tr}`, `/en/${slug.en}`];
      if (slug.tr === 'anasayfa' || slug.en === 'home') paths.push('/tr', '/en');
      void this.cacheService.invalidateContent(paths);
    }
    return seo;
  }

  async upsertForBlogPost(postId: string, dto: UpdateSeoMetaDto): Promise<SeoMeta> {
    const post = await this.prisma.blogPost.findUniqueOrThrow({
      where: { id: postId },
      include: { seo: true },
    });

    let seo: SeoMeta;
    if (post.seo) {
      seo = await this.prisma.seoMeta.update({
        where: { id: post.seo.id },
        data: dto as Prisma.SeoMetaUpdateInput,
      });
    } else {
      seo = await this.prisma.seoMeta.create({
        data: dto as Prisma.SeoMetaCreateInput,
      });
      await this.prisma.blogPost.update({
        where: { id: postId },
        data: { seoMetaId: seo.id },
      });
    }

    if (post.status === 'PUBLISHED') {
      const slug = post.slug as LocaleMap;
      void this.cacheService.invalidateContent([
        `/tr/blog/${slug.tr}`,
        `/en/blog/${slug.en}`,
      ]);
    }
    return seo;
  }

  async upsertForProduct(productId: string, dto: UpdateSeoMetaDto): Promise<SeoMeta> {
    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: { seo: true },
    });

    let seo: SeoMeta;
    if (product.seo) {
      seo = await this.prisma.seoMeta.update({
        where: { id: product.seo.id },
        data: dto as Prisma.SeoMetaUpdateInput,
      });
    } else {
      seo = await this.prisma.seoMeta.create({
        data: dto as Prisma.SeoMetaCreateInput,
      });
      await this.prisma.product.update({
        where: { id: productId },
        data: { seoMetaId: seo.id },
      });
    }

    if (product.status === 'PUBLISHED') {
      const slug = product.slug as LocaleMap;
      void this.cacheService.invalidateContent([
        `/tr/products/${slug.tr}`,
        `/en/products/${slug.en}`,
      ]);
    }
    return seo;
  }

  generateJsonLd(
    entityType: 'page' | 'blog' | 'product',
    entity: unknown,
    locale: 'tr' | 'en',
  ): object {
    switch (entityType) {
      case 'blog': {
        const post = entity as BlogPost & { author: User; seo: SeoMeta };
        return {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: (post.title as LocaleMap)[locale],
          author: { '@type': 'Person', name: post.author.email },
          datePublished: post.publishedAt?.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          publisher: { '@type': 'Organization', name: 'Krontech' },
        };
      }
      case 'product': {
        const prod = entity as Product;
        return {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: (prod.name as LocaleMap)[locale],
          description: (prod.description as LocaleMap)[locale],
          applicationCategory: 'BusinessApplication',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        };
      }
      default: {
        const page = entity as Page & { components: PageComponent[] };
        const faqComponent = page.components.find((c) => c.type === 'faq');
        if (faqComponent) {
          const faqData = faqComponent.data as {
            items: Array<{ question: LocaleMap; answer: LocaleMap }>;
          };
          return {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqData.items.map((item) => ({
              '@type': 'Question',
              name: item.question[locale],
              acceptedAnswer: { '@type': 'Answer', text: item.answer[locale] },
            })),
          };
        }
        return {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Krontech',
        };
      }
    }
  }

  async generateSitemap(): Promise<string> {
    const [pages, posts, products] = await Promise.all([
      this.prisma.page.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
      }),
      this.prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
      }),
      this.prisma.product.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://krontech.com';
    const locales: Array<'tr' | 'en'> = ['tr', 'en'];

    const urls: string[] = [];

    for (const page of pages) {
      const slug = page.slug as LocaleMap;
      for (const locale of locales) {
        urls.push(
          `  <url>\n    <loc>${baseUrl}/${locale}/${slug[locale]}</loc>\n    <lastmod>${page.updatedAt.toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>`,
        );
      }
    }

    for (const post of posts) {
      const slug = post.slug as LocaleMap;
      for (const locale of locales) {
        urls.push(
          `  <url>\n    <loc>${baseUrl}/${locale}/blog/${slug[locale]}</loc>\n    <lastmod>${post.updatedAt.toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>`,
        );
      }
    }

    for (const product of products) {
      const slug = product.slug as LocaleMap;
      for (const locale of locales) {
        urls.push(
          `  <url>\n    <loc>${baseUrl}/${locale}/products/${slug[locale]}</loc>\n    <lastmod>${product.updatedAt.toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n  </url>`,
        );
      }
    }

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
  }

  async getSitemap(cacheService: { getCachedSitemap: () => Promise<string | null> }): Promise<string> {
    const cached = await cacheService.getCachedSitemap();
    if (cached) return cached;
    return this.generateSitemap();
  }

  async getOgImageUrl(media: Media | null): Promise<string | undefined> {
    if (!media) return undefined;
    return media.publicUrl;
  }
}
