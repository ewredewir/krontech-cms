import { Test, TestingModule } from '@nestjs/testing';
import { SeoService } from './seo.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  page: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
  blogPost: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
  product: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
  seoMeta: { create: jest.fn(), update: jest.fn() },
};

describe('SeoService', () => {
  let service: SeoService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeoService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SeoService>(SeoService);
  });

  describe('generateJsonLd', () => {
    it('generates Article schema for blog posts with required fields', () => {
      const post = {
        id: 'bp-1',
        title: { tr: 'Makale', en: 'Article' },
        publishedAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        author: { email: 'author@test.com' },
        seo: null,
      };

      const result = service.generateJsonLd('blog', post, 'en') as Record<string, unknown>;

      expect(result['@type']).toBe('Article');
      expect(result['@context']).toBe('https://schema.org');
      expect(result['headline']).toBe('Article');
      expect(result['author']).toMatchObject({ '@type': 'Person', name: 'author@test.com' });
      expect(result['datePublished']).toBeDefined();
    });

    it('generates SoftwareApplication schema for products', () => {
      const product = {
        id: 'prod-1',
        name: { tr: 'Ürün', en: 'Product' },
        description: { tr: 'Açıklama', en: 'Description' },
      };

      const result = service.generateJsonLd('product', product, 'en') as Record<string, unknown>;

      expect(result['@type']).toBe('SoftwareApplication');
      expect(result['name']).toBe('Product');
      expect(result['description']).toBe('Description');
    });

    it('generates FAQPage schema for pages with faq component', () => {
      const page = {
        id: 'page-1',
        slug: { tr: 'sayfa', en: 'page' },
        components: [
          {
            type: 'faq',
            data: {
              items: [
                { question: { tr: 'Soru 1', en: 'Question 1' }, answer: { tr: 'Cevap 1', en: 'Answer 1' } },
              ],
            },
          },
        ],
      };

      const result = service.generateJsonLd('page', page, 'en') as Record<string, unknown>;

      expect(result['@type']).toBe('FAQPage');
      const entities = result['mainEntity'] as Array<Record<string, unknown>>;
      expect(entities[0]['name']).toBe('Question 1');
    });

    it('generates WebPage schema for pages without faq component', () => {
      const page = {
        id: 'page-1',
        slug: { tr: 'sayfa', en: 'page' },
        components: [{ type: 'hero', data: {} }],
      };

      const result = service.generateJsonLd('page', page, 'en') as Record<string, unknown>;

      expect(result['@type']).toBe('WebPage');
    });

    it('respects jsonLdOverride field name (seo on entity)', () => {
      const post = {
        id: 'bp-2',
        title: { tr: 'Başlık', en: 'Title' },
        publishedAt: new Date(),
        updatedAt: new Date(),
        author: { email: 'a@a.com' },
        seo: { jsonLdOverride: { '@type': 'NewsArticle', headline: 'Custom' } },
      };

      const result = service.generateJsonLd('blog', post, 'en') as Record<string, unknown>;
      expect(result['@type']).toBe('Article');
    });
  });
});
