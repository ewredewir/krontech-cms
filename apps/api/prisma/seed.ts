import { PrismaClient, ContentStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Stable IDs so seed is idempotent via upsert
const IDS = {
  seo: {
    homepage: '20000000-0000-0000-0000-000000000001',
    about: '20000000-0000-0000-0000-000000000002',
    contact: '20000000-0000-0000-0000-000000000003',
    post1: '20000000-0000-0000-0000-000000000011',
    post2: '20000000-0000-0000-0000-000000000012',
    post3: '20000000-0000-0000-0000-000000000013',
    post4: '20000000-0000-0000-0000-000000000014',
    post5: '20000000-0000-0000-0000-000000000015',
    product1: '20000000-0000-0000-0000-000000000021',
    product2: '20000000-0000-0000-0000-000000000022',
  },
  page: {
    homepage: '10000000-0000-0000-0000-000000000001',
    about: '10000000-0000-0000-0000-000000000002',
    contact: '10000000-0000-0000-0000-000000000003',
  },
  post: {
    p1: '30000000-0000-0000-0000-000000000001',
    p2: '30000000-0000-0000-0000-000000000002',
    p3: '30000000-0000-0000-0000-000000000003',
    p4: '30000000-0000-0000-0000-000000000004',
    p5: '30000000-0000-0000-0000-000000000005',
  },
  product: {
    prod1: '40000000-0000-0000-0000-000000000001',
    prod2: '40000000-0000-0000-0000-000000000002',
  },
};

async function main() {
  const adminExists = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });

  if (adminExists && process.env.FORCE_SEED !== '1') {
    console.log('✓ Database already seeded — skipping. Run with FORCE_SEED=1 to override.');
    return;
  }

  console.log('⚙ Running seed...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@krontech.com' },
    update: {},
    create: {
      email: 'admin@krontech.com',
      passwordHash: await bcrypt.hash('password', 12),
      role: UserRole.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'editor@krontech.com' },
    update: {},
    create: {
      email: 'editor@krontech.com',
      passwordHash: await bcrypt.hash('password', 12),
      role: UserRole.EDITOR,
    },
  });

  // SeoMeta records
  const seoHomepage = await prisma.seoMeta.upsert({
    where: { id: IDS.seo.homepage },
    update: {},
    create: {
      id: IDS.seo.homepage,
      metaTitle: { tr: 'Ana Sayfa | Krontech', en: 'Home | Krontech' },
      metaDescription: { tr: 'Krontech ana sayfası', en: 'Krontech home page' },
      robots: 'index, follow',
    },
  });

  const seoAbout = await prisma.seoMeta.upsert({
    where: { id: IDS.seo.about },
    update: {},
    create: {
      id: IDS.seo.about,
      metaTitle: { tr: 'Hakkımızda | Krontech', en: 'About Us | Krontech' },
      metaDescription: { tr: 'Krontech hakkında', en: 'About Krontech' },
      robots: 'index, follow',
    },
  });

  const seoContact = await prisma.seoMeta.upsert({
    where: { id: IDS.seo.contact },
    update: {},
    create: {
      id: IDS.seo.contact,
      metaTitle: { tr: 'İletişim | Krontech', en: 'Contact | Krontech' },
      metaDescription: { tr: 'Krontech iletişim sayfası', en: 'Krontech contact page' },
      robots: 'index, follow',
    },
  });

  // Pages
  await prisma.page.upsert({
    where: { id: IDS.page.homepage },
    update: {},
    create: {
      id: IDS.page.homepage,
      slug: { tr: 'anasayfa', en: 'home' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      seoMetaId: seoHomepage.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.page.upsert({
    where: { id: IDS.page.about },
    update: {},
    create: {
      id: IDS.page.about,
      slug: { tr: 'hakkimizda', en: 'about' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      seoMetaId: seoAbout.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.page.upsert({
    where: { id: IDS.page.contact },
    update: {},
    create: {
      id: IDS.page.contact,
      slug: { tr: 'iletisim', en: 'contact' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      seoMetaId: seoContact.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  // Category and tags
  const category = await prisma.category.upsert({
    where: { slug: 'teknoloji' },
    update: {},
    create: {
      slug: 'teknoloji',
      name: { tr: 'Teknoloji', en: 'Technology' },
    },
  });

  const tag1 = await prisma.tag.upsert({
    where: { slug: 'nestjs' },
    update: {},
    create: { slug: 'nestjs', name: { tr: 'NestJS', en: 'NestJS' } },
  });

  const tag2 = await prisma.tag.upsert({
    where: { slug: 'prisma' },
    update: {},
    create: { slug: 'prisma', name: { tr: 'Prisma', en: 'Prisma' } },
  });

  // SeoMeta for blog posts
  const seoPosts = await Promise.all([
    prisma.seoMeta.upsert({
      where: { id: IDS.seo.post1 },
      update: {},
      create: { id: IDS.seo.post1, metaTitle: { tr: 'NestJS ile API Geliştirme', en: 'API Development with NestJS' }, metaDescription: { tr: 'NestJS rehberi', en: 'NestJS guide' }, robots: 'index, follow' },
    }),
    prisma.seoMeta.upsert({
      where: { id: IDS.seo.post2 },
      update: {},
      create: { id: IDS.seo.post2, metaTitle: { tr: 'Prisma ile Veritabanı', en: 'Database with Prisma' }, metaDescription: { tr: 'Prisma rehberi', en: 'Prisma guide' }, robots: 'index, follow' },
    }),
    prisma.seoMeta.upsert({
      where: { id: IDS.seo.post3 },
      update: {},
      create: { id: IDS.seo.post3, metaTitle: { tr: 'TypeScript İpuçları', en: 'TypeScript Tips' }, metaDescription: { tr: 'TypeScript ipuçları', en: 'TypeScript tips' }, robots: 'index, follow' },
    }),
    prisma.seoMeta.upsert({
      where: { id: IDS.seo.post4 },
      update: {},
      create: { id: IDS.seo.post4, metaTitle: { tr: 'Docker ile Deployment', en: 'Deployment with Docker' }, metaDescription: { tr: 'Docker rehberi', en: 'Docker guide' }, robots: 'noindex, nofollow' },
    }),
    prisma.seoMeta.upsert({
      where: { id: IDS.seo.post5 },
      update: {},
      create: { id: IDS.seo.post5, metaTitle: { tr: 'JWT Güvenliği', en: 'JWT Security' }, metaDescription: { tr: 'JWT güvenlik rehberi', en: 'JWT security guide' }, robots: 'noindex, nofollow' },
    }),
  ]);

  // Blog posts
  await prisma.blogPost.upsert({
    where: { id: IDS.post.p1 },
    update: {},
    create: {
      id: IDS.post.p1,
      slug: { tr: 'nestjs-ile-api-gelistirme', en: 'api-development-with-nestjs' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date('2026-01-10'),
      title: { tr: 'NestJS ile API Geliştirme', en: 'API Development with NestJS' },
      excerpt: { tr: 'NestJS ile modern API nasıl inşa edilir.', en: 'How to build a modern API with NestJS.' },
      body: { tr: '## NestJS\n\nNestJS güçlü bir Node.js framework\'üdür.', en: '## NestJS\n\nNestJS is a powerful Node.js framework.' },
      readingTimeMinutes: 5,
      authorId: admin.id,
      categoryId: category.id,
      tags: { connect: [{ id: tag1.id }] },
      seoMetaId: seoPosts[0]!.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.blogPost.upsert({
    where: { id: IDS.post.p2 },
    update: {},
    create: {
      id: IDS.post.p2,
      slug: { tr: 'prisma-ile-veritabani', en: 'database-with-prisma' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date('2026-01-20'),
      title: { tr: 'Prisma ile Veritabanı Yönetimi', en: 'Database Management with Prisma' },
      excerpt: { tr: 'Prisma ORM ile tip-güvenli veritabanı işlemleri.', en: 'Type-safe database operations with Prisma ORM.' },
      body: { tr: '## Prisma ORM\n\nPrisma modern bir ORM\'dir.', en: '## Prisma ORM\n\nPrisma is a modern ORM.' },
      readingTimeMinutes: 7,
      authorId: admin.id,
      categoryId: category.id,
      tags: { connect: [{ id: tag2.id }] },
      seoMetaId: seoPosts[1]!.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.blogPost.upsert({
    where: { id: IDS.post.p3 },
    update: {},
    create: {
      id: IDS.post.p3,
      slug: { tr: 'typescript-ipuclari', en: 'typescript-tips' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date('2026-02-01'),
      title: { tr: 'TypeScript İpuçları', en: 'TypeScript Tips' },
      excerpt: { tr: 'Üretkenliğinizi artıracak TypeScript ipuçları.', en: 'TypeScript tips to boost your productivity.' },
      body: { tr: '## TypeScript\n\nTip güvenliği önemlidir.', en: '## TypeScript\n\nType safety matters.' },
      readingTimeMinutes: 4,
      authorId: admin.id,
      categoryId: category.id,
      tags: { connect: [{ id: tag1.id }, { id: tag2.id }] },
      seoMetaId: seoPosts[2]!.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.blogPost.upsert({
    where: { id: IDS.post.p4 },
    update: {},
    create: {
      id: IDS.post.p4,
      slug: { tr: 'docker-ile-deployment', en: 'deployment-with-docker' },
      status: ContentStatus.DRAFT,
      title: { tr: 'Docker ile Deployment', en: 'Deployment with Docker' },
      excerpt: { tr: 'Docker ile production deployment rehberi.', en: 'Production deployment guide with Docker.' },
      body: { tr: '## Docker\n\nDocker konteynerleri izole eder.', en: '## Docker\n\nDocker isolates containers.' },
      readingTimeMinutes: 6,
      authorId: admin.id,
      categoryId: category.id,
      seoMetaId: seoPosts[3]!.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.blogPost.upsert({
    where: { id: IDS.post.p5 },
    update: {},
    create: {
      id: IDS.post.p5,
      slug: { tr: 'jwt-guvenligi', en: 'jwt-security' },
      status: ContentStatus.DRAFT,
      title: { tr: 'JWT Güvenliği', en: 'JWT Security' },
      excerpt: { tr: 'JWT token güvenliği için en iyi pratikler.', en: 'Best practices for JWT token security.' },
      body: { tr: '## JWT\n\nToken güvenliği kritiktir.', en: '## JWT\n\nToken security is critical.' },
      readingTimeMinutes: 8,
      authorId: admin.id,
      seoMetaId: seoPosts[4]!.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  // SeoMeta for products
  const seoProducts = await Promise.all([
    prisma.seoMeta.upsert({
      where: { id: IDS.seo.product1 },
      update: {},
      create: { id: IDS.seo.product1, metaTitle: { tr: 'CMS Pro', en: 'CMS Pro' }, metaDescription: { tr: 'Kurumsal içerik yönetim sistemi', en: 'Enterprise content management system' }, robots: 'index, follow' },
    }),
    prisma.seoMeta.upsert({
      where: { id: IDS.seo.product2 },
      update: {},
      create: { id: IDS.seo.product2, metaTitle: { tr: 'Analytics Suite', en: 'Analytics Suite' }, metaDescription: { tr: 'Gelişmiş analitik çözümü', en: 'Advanced analytics solution' }, robots: 'index, follow' },
    }),
  ]);

  // Products
  await prisma.product.upsert({
    where: { id: IDS.product.prod1 },
    update: {},
    create: {
      id: IDS.product.prod1,
      slug: { tr: 'cms-pro', en: 'cms-pro' },
      status: ContentStatus.PUBLISHED,
      name: { tr: 'CMS Pro', en: 'CMS Pro' },
      tagline: { tr: 'Kurumsal içerik yönetimi', en: 'Enterprise content management' },
      description: { tr: '## CMS Pro\n\nTam özellikli içerik yönetim sistemi.', en: '## CMS Pro\n\nFull-featured content management system.' },
      features: [
        { title: { tr: 'Çok Dilli', en: 'Multi-language' }, description: { tr: 'TR ve EN desteği', en: 'TR and EN support' } },
        { title: { tr: 'SEO Optimize', en: 'SEO Optimized' }, description: { tr: 'Otomatik SEO araçları', en: 'Automatic SEO tools' } },
      ],
      seoMetaId: seoProducts[0]!.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.product.upsert({
    where: { id: IDS.product.prod2 },
    update: {},
    create: {
      id: IDS.product.prod2,
      slug: { tr: 'analytics-suite', en: 'analytics-suite' },
      status: ContentStatus.PUBLISHED,
      name: { tr: 'Analytics Suite', en: 'Analytics Suite' },
      tagline: { tr: 'Veriye dayalı kararlar alın', en: 'Make data-driven decisions' },
      description: { tr: '## Analytics Suite\n\nGelişmiş analitik platformu.', en: '## Analytics Suite\n\nAdvanced analytics platform.' },
      features: [
        { title: { tr: 'Gerçek Zamanlı', en: 'Real-time' }, description: { tr: 'Canlı veri akışı', en: 'Live data streaming' } },
        { title: { tr: 'Özel Raporlar', en: 'Custom Reports' }, description: { tr: 'Esnek raporlama', en: 'Flexible reporting' } },
      ],
      seoMetaId: seoProducts[1]!.id,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  // Form definitions
  await prisma.formDefinition.upsert({
    where: { slug: 'contact' },
    update: {},
    create: {
      name: 'Contact Form',
      slug: 'contact',
      fields: [
        { name: 'firstName', type: 'text', label: { tr: 'İsim', en: 'First Name' }, required: true },
        { name: 'lastName', type: 'text', label: { tr: 'Soyisim', en: 'Last Name' }, required: true },
        { name: 'email', type: 'email', label: { tr: 'E-posta', en: 'Email' }, required: true },
        { name: 'department', type: 'text', label: { tr: 'Departman', en: 'Department' }, required: true },
        { name: 'company', type: 'text', label: { tr: 'Şirket', en: 'Company' }, required: true },
        { name: 'phone', type: 'phone', label: { tr: 'Telefon', en: 'Phone' }, required: false },
        { name: 'message', type: 'textarea', label: { tr: 'Mesaj', en: 'Message' }, required: false },
      ],
      isActive: true,
    },
  });

  await prisma.formDefinition.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Request',
      slug: 'demo',
      fields: [
        { name: 'company', type: 'text', label: { tr: 'Şirket', en: 'Company' }, required: true },
        { name: 'name', type: 'text', label: { tr: 'İsim', en: 'Name' }, required: true },
        { name: 'email', type: 'email', label: { tr: 'E-posta', en: 'Email' }, required: true },
        { name: 'phone', type: 'phone', label: { tr: 'Telefon', en: 'Phone' }, required: false },
        { name: 'productInterest', type: 'text', label: { tr: 'Ürün İlgisi', en: 'Product Interest' }, required: true },
        { name: 'message', type: 'textarea', label: { tr: 'Mesaj', en: 'Message' }, required: false },
      ],
      isActive: true,
    },
  });

  // Redirects
  await prisma.redirect.upsert({
    where: { source: '/eski-anasayfa' },
    update: {},
    create: { source: '/eski-anasayfa', destination: '/', statusCode: 301, isActive: true },
  });

  await prisma.redirect.upsert({
    where: { source: '/blog/eski-yazi' },
    update: {},
    create: { source: '/blog/eski-yazi', destination: '/blog', statusCode: 302, isActive: true },
  });

  console.log('✓ Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
