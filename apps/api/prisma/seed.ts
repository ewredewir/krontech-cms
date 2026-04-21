import { PrismaClient, ContentStatus, UserRole, ComponentType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const S3_ENDPOINT  = process.env.S3_ENDPOINT  ?? 'http://minio:9000';
const S3_BUCKET    = process.env.S3_BUCKET    ?? 'krontech-media';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY ?? '';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY ?? '';
const PRODUCT_IMAGES_DIR = path.resolve(__dirname, '..', 'assets', 'products');
const BLOG_IMAGES_DIR = path.resolve(__dirname, '..', '..', '..', 'apps', 'web', 'public', 'assets', 'uploads', 'content');

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: 'us-east-1',
  credentials: { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY },
  forcePathStyle: true,
});

// All IDs are stable so the seed is fully idempotent via upsert.
const IDS = {
  seo: {
    homepage:  '20000000-0000-0000-0000-000000000001',
    contact:   '20000000-0000-0000-0000-000000000003',
    demo:      '20000000-0000-0000-0000-000000000004',
    post1:     '20000000-0000-0000-0000-000000000011',
    post2:     '20000000-0000-0000-0000-000000000012',
    post3:     '20000000-0000-0000-0000-000000000013',
    post4:     '20000000-0000-0000-0000-000000000014',
    post5:     '20000000-0000-0000-0000-000000000015',
    pam:       '20000000-0000-0000-0000-000000000021',
    dam:       '20000000-0000-0000-0000-000000000022',
    ddm:       '20000000-0000-0000-0000-000000000023',
    qa:        '20000000-0000-0000-0000-000000000024',
    aaa:       '20000000-0000-0000-0000-000000000025',
    tlmp:      '20000000-0000-0000-0000-000000000026',
  },
  page: {
    homepage:  '10000000-0000-0000-0000-000000000001',
    contact:   '10000000-0000-0000-0000-000000000003',
    demo:      '10000000-0000-0000-0000-000000000004',
  },
  component: {
    // Legacy homepage placeholder IDs — upserts removed but IDs kept for reference
    homepage_hero:      'c0000000-0000-0000-0000-000000000001',
    homepage_products:  'c0000000-0000-0000-0000-000000000002',
    homepage_cta:       'c0000000-0000-0000-0000-000000000003',
    // New homepage component IDs
    homepage_hero_slider:  'c0000000-0000-0000-0000-000000000051',
    homepage_products_cat: 'c0000000-0000-0000-0000-000000000052',
    homepage_kuppinger:    'c0000000-0000-0000-0000-000000000053',
    homepage_why_kron:     'c0000000-0000-0000-0000-000000000054',
    homepage_stats:        'c0000000-0000-0000-0000-000000000055',
    homepage_video:        'c0000000-0000-0000-0000-000000000056',
    homepage_blog:         'c0000000-0000-0000-0000-000000000057',
    homepage_contact:      'c0000000-0000-0000-0000-000000000058',
    contact_hero:       'c0000000-0000-0000-0000-000000000021',
    contact_form:       'c0000000-0000-0000-0000-000000000022',
    demo_hero:          'c0000000-0000-0000-0000-000000000031',
    demo_form:          'c0000000-0000-0000-0000-000000000032',
  },
  form: {
    contact: '50000000-0000-0000-0000-000000000001',
    demo:    '50000000-0000-0000-0000-000000000002',
  },
  product: {
    pam:  '40000000-0000-0000-0000-000000000001',
    dam:  '40000000-0000-0000-0000-000000000002',
    ddm:  '40000000-0000-0000-0000-000000000003',
    qa:   '40000000-0000-0000-0000-000000000004',
    aaa:  '40000000-0000-0000-0000-000000000005',
    tlmp: '40000000-0000-0000-0000-000000000006',
  },
  media: {
    pam:  '60000000-0000-0000-0000-000000000001',
    dam:  '60000000-0000-0000-0000-000000000002',
    ddm:  '60000000-0000-0000-0000-000000000003',
    qa:   '60000000-0000-0000-0000-000000000004',
    aaa:  '60000000-0000-0000-0000-000000000005',
    tlmp: '60000000-0000-0000-0000-000000000006',
    blog_post1: '60000000-0000-0000-0000-000000000011',
    blog_post2: '60000000-0000-0000-0000-000000000012',
    blog_post3: '60000000-0000-0000-0000-000000000013',
    blog_post4: '60000000-0000-0000-0000-000000000014',
    blog_post5: '60000000-0000-0000-0000-000000000015',
  },
  post: {
    p1: '30000000-0000-0000-0000-000000000001',
    p2: '30000000-0000-0000-0000-000000000002',
    p3: '30000000-0000-0000-0000-000000000003',
    p4: '30000000-0000-0000-0000-000000000004',
    p5: '30000000-0000-0000-0000-000000000005',
  },
  nav: {
    // Turkish top-level
    tr_products:  'a0000000-0000-0000-0000-000000000001',
    tr_resources: 'a0000000-0000-0000-0000-000000000008',
    tr_blog:      'a0000000-0000-0000-0000-000000000009',
    tr_contact:   'a0000000-0000-0000-0000-000000000011',
    tr_demo:      'a0000000-0000-0000-0000-000000000012',
    // Turkish children (Products dropdown)
    tr_pam:  'a0000000-0000-0000-0000-000000000002',
    tr_dam:  'a0000000-0000-0000-0000-000000000003',
    tr_ddm:  'a0000000-0000-0000-0000-000000000004',
    tr_qa:   'a0000000-0000-0000-0000-000000000005',
    tr_aaa:  'a0000000-0000-0000-0000-000000000006',
    tr_tlmp: 'a0000000-0000-0000-0000-000000000007',
    // English top-level
    en_products:  'a0000000-0000-0000-0000-000000000021',
    en_resources: 'a0000000-0000-0000-0000-000000000028',
    en_blog:      'a0000000-0000-0000-0000-000000000029',
    en_contact:   'a0000000-0000-0000-0000-000000000031',
    en_demo:      'a0000000-0000-0000-0000-000000000032',
    // English children (Products dropdown)
    en_pam:  'a0000000-0000-0000-0000-000000000022',
    en_dam:  'a0000000-0000-0000-0000-000000000023',
    en_ddm:  'a0000000-0000-0000-0000-000000000024',
    en_qa:   'a0000000-0000-0000-0000-000000000025',
    en_aaa:  'a0000000-0000-0000-0000-000000000026',
    en_tlmp: 'a0000000-0000-0000-0000-000000000027',
  },
};

async function upsertProductMedia(
  productId: string,
  mediaId: string,
  filename: string,
  uploadedById: string,
) {
  const filePath = path.join(PRODUCT_IMAGES_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ Image not found: ${filePath} — skipping`);
    return;
  }
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filename).toLowerCase();
  const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  const s3Key = `uploads/products/${filename}`;

  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: mimeType,
  }));

  const publicUrl = `${S3_ENDPOINT}/${S3_BUCKET}/${s3Key}`;

  await prisma.media.upsert({
    where: { id: mediaId },
    update: { publicUrl },
    create: {
      id: mediaId,
      filename,
      mimeType,
      size: fileBuffer.length,
      s3Key,
      publicUrl,
      altText: { tr: filename, en: filename },
      uploadedById,
    },
  });

  await prisma.productMedia.upsert({
    where: { productId_mediaId: { productId, mediaId } },
    update: { order: 1 },
    create: { productId, mediaId, order: 1 },
  });
}

const PRODUCT_MEDIA_MANIFEST: Array<[string, string, string]> = [
  [IDS.product.pam,  IDS.media.pam,  'pam.jpg'],
  [IDS.product.dam,  IDS.media.dam,  'dam.png'],
  [IDS.product.ddm,  IDS.media.ddm,  'ddm.png'],
  [IDS.product.qa,   IDS.media.qa,   'qa.png'],
  [IDS.product.aaa,  IDS.media.aaa,  'aaa.png'],
  [IDS.product.tlmp, IDS.media.tlmp, 'tlmp.png'],
];

const BLOG_MEDIA_MANIFEST: Array<[string, string, string]> = [
  [IDS.post.p1, IDS.media.blog_post1, '7-basic-steps-to-identify-a-data-breach-blog-730x411_3.jpg'],
  [IDS.post.p2, IDS.media.blog_post2, 'oracle-rac-simplified-how-kron-damddm-secures-multi-node-databases.png'],
  [IDS.post.p3, IDS.media.blog_post3, 'turning-firewall-logs-into-ipdr-with-kron-telemetry-pipeline.jpg'],
  [IDS.post.p4, IDS.media.blog_post4, 'unifying-kubernetes-telemetry-in-a-diverse-and-fragmented-collector-world_blog.png'],
  [IDS.post.p5, IDS.media.blog_post5, 'your-biggest-security-risk-isn-t-human-fixing-non-human-identities-with-kron-pam_blog.png'],
];

async function upsertBlogMedia(
  mediaId: string,
  filename: string,
  uploadedById: string,
): Promise<void> {
  const filePath = path.join(BLOG_IMAGES_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ Blog image not found: ${filePath} — skipping`);
    return;
  }
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filename).toLowerCase();
  const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  const s3Key = `uploads/content/${filename}`;

  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: mimeType,
  }));

  const publicUrl = `${S3_ENDPOINT}/${S3_BUCKET}/${s3Key}`;

  await prisma.media.upsert({
    where: { id: mediaId },
    update: { publicUrl },
    create: {
      id: mediaId,
      filename,
      mimeType,
      size: fileBuffer.length,
      s3Key,
      publicUrl,
      altText: { tr: filename, en: filename },
      uploadedById,
    },
  });
}

async function main() {
  const adminExists = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
  const navCount = await prisma.navigationItem.count();

  if (adminExists && navCount > 0 && process.env.FORCE_SEED !== '1') {
    const mediaCount = await prisma.productMedia.count();
    if (mediaCount === 0) {
      console.log('⚙ Backfilling missing product media...');
      for (const [productId, mediaId, filename] of PRODUCT_MEDIA_MANIFEST) {
        await upsertProductMedia(productId, mediaId, filename, adminExists.id);
      }
    }
    console.log('✓ Database already seeded — skipping. Run with FORCE_SEED=1 to override.');
    return;
  }

  console.log('⚙ Running seed...');

  // ─── Users ────────────────────────────────────────────────────────────────────

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

  // ─── SeoMeta for pages ───────────────────────────────────────────────────────

  await prisma.seoMeta.upsert({
    where: { id: IDS.seo.homepage },
    update: { metaTitle: { tr: 'Siber Güvenlik Çözümleri | Krontech', en: 'Cybersecurity Solutions | Krontech' } },
    create: {
      id: IDS.seo.homepage,
      metaTitle: { tr: 'Siber Güvenlik Çözümleri | Krontech', en: 'Cybersecurity Solutions | Krontech' },
      metaDescription: { tr: 'Krontech, PAM, DAM, DDM ve diğer siber güvenlik çözümleriyle işletmenizi korur.', en: 'Krontech protects your business with PAM, DAM, DDM and other cybersecurity solutions.' },
      robots: 'index, follow',
    },
  });

  await prisma.seoMeta.upsert({
    where: { id: IDS.seo.contact },
    update: { metaTitle: { tr: 'İletişim | Krontech', en: 'Contact | Krontech' } },
    create: {
      id: IDS.seo.contact,
      metaTitle: { tr: 'İletişim | Krontech', en: 'Contact | Krontech' },
      metaDescription: { tr: 'Krontech ile iletişime geçin.', en: 'Get in touch with Krontech.' },
      robots: 'index, follow',
    },
  });

  await prisma.seoMeta.upsert({
    where: { id: IDS.seo.demo },
    update: { metaTitle: { tr: 'Demo Talebi | Krontech', en: 'Request Demo | Krontech' } },
    create: {
      id: IDS.seo.demo,
      metaTitle: { tr: 'Demo Talebi | Krontech', en: 'Request Demo | Krontech' },
      metaDescription: { tr: 'Krontech ürünleri için demo talep edin.', en: 'Request a demo for Krontech products.' },
      robots: 'index, follow',
    },
  });

  // ─── Pages ───────────────────────────────────────────────────────────────────

  await prisma.page.upsert({
    where: { id: IDS.page.homepage },
    update: { slug: { tr: 'anasayfa', en: 'home' } },
    create: {
      id: IDS.page.homepage,
      slug: { tr: 'anasayfa', en: 'home' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      seoMetaId: IDS.seo.homepage,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.page.upsert({
    where: { id: IDS.page.contact },
    update: { slug: { tr: 'iletisim', en: 'contact' } },
    create: {
      id: IDS.page.contact,
      slug: { tr: 'iletisim', en: 'contact' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      seoMetaId: IDS.seo.contact,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.page.upsert({
    where: { id: IDS.page.demo },
    update: { slug: { tr: 'demo', en: 'demo' } },
    create: {
      id: IDS.page.demo,
      slug: { tr: 'demo', en: 'demo' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      seoMetaId: IDS.seo.demo,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  // ─── Form Definitions (with stable IDs) ──────────────────────────────────────

  const contactForm = await prisma.formDefinition.upsert({
    where: { slug: 'contact' },
    update: {},
    create: {
      id: IDS.form.contact,
      name: 'Contact Form',
      slug: 'contact',
      fields: [
        { name: 'firstName',  type: 'text',     label: { tr: 'İsim',      en: 'First Name' }, required: true },
        { name: 'lastName',   type: 'text',     label: { tr: 'Soyisim',   en: 'Last Name'  }, required: true },
        { name: 'email',      type: 'email',    label: { tr: 'E-posta',   en: 'Email'      }, required: true },
        { name: 'department', type: 'text',     label: { tr: 'Departman', en: 'Department' }, required: true },
        { name: 'company',    type: 'text',     label: { tr: 'Şirket',    en: 'Company'    }, required: true },
        { name: 'phone',      type: 'phone',    label: { tr: 'Telefon',   en: 'Phone'      }, required: false },
        { name: 'message',    type: 'textarea', label: { tr: 'Mesaj',     en: 'Message'    }, required: false },
      ],
      isActive: true,
    },
  });

  const demoForm = await prisma.formDefinition.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      id: IDS.form.demo,
      name: 'Demo Request',
      slug: 'demo',
      fields: [
        { name: 'company',         type: 'text',     label: { tr: 'Şirket',       en: 'Company'          }, required: true },
        { name: 'name',            type: 'text',     label: { tr: 'İsim',         en: 'Name'             }, required: true },
        { name: 'email',           type: 'email',    label: { tr: 'E-posta',      en: 'Email'            }, required: true },
        { name: 'phone',           type: 'phone',    label: { tr: 'Telefon',      en: 'Phone'            }, required: false },
        { name: 'productInterest', type: 'text',     label: { tr: 'Ürün İlgisi',  en: 'Product Interest' }, required: true },
        { name: 'message',         type: 'textarea', label: { tr: 'Mesaj',        en: 'Message'          }, required: false },
      ],
      isActive: true,
    },
  });

  // ─── Page Components ─────────────────────────────────────────────────────────

  // Homepage — 8 sections matching the live home page layout
  await prisma.pageComponent.upsert({
    where: { id: IDS.component.homepage_hero_slider },
    update: {},
    create: {
      id: IDS.component.homepage_hero_slider,
      pageId: IDS.page.homepage,
      type: ComponentType.hero_slider,
      order: 1,
      isVisible: true,
      data: {
        __type: 'hero_slider',
        slides: [
          {
            heading: {
              tr: 'Privileged Access Management <span class="bg-blue">Çözümleri</span>',
              en: 'Privileged Access Management <span class="bg-blue">Solutions</span>',
            },
            subheading: {
              tr: 'Kritik sistem ve verilere yetkisiz erişimi engelleyin, ayrıcalıklı hesapları güvende tutun.',
              en: 'Prevent unauthorized access to critical systems and data, keep privileged accounts secure.',
            },
            ctaLabel: { tr: 'Daha Fazla Bilgi', en: 'Learn More' },
            ctaUrl: '/products/pam',
          },
          {
            heading: {
              tr: 'KuppingerCole <span class="bg-blue">Liderlik Ödülü</span>',
              en: 'KuppingerCole <span class="bg-blue">Leadership Award</span>',
            },
            subheading: {
              tr: 'KuppingerCole Leadership Compass PAM raporunda Overall Leader seçildik.',
              en: 'Selected as Overall Leader in KuppingerCole Leadership Compass PAM report.',
            },
            ctaLabel: { tr: 'Raporu İncele', en: 'View Report' },
            ctaUrl: '/resources',
          },
        ],
      },
    },
  });

  await prisma.pageComponent.upsert({
    where: { id: IDS.component.homepage_products_cat },
    update: {},
    create: {
      id: IDS.component.homepage_products_cat,
      pageId: IDS.page.homepage,
      type: ComponentType.product_catalog,
      order: 2,
      isVisible: true,
      data: { __type: 'product_catalog' },
    },
  });

  await prisma.pageComponent.upsert({
    where: { id: IDS.component.homepage_kuppinger },
    update: {},
    create: {
      id: IDS.component.homepage_kuppinger,
      pageId: IDS.page.homepage,
      type: ComponentType.kuppinger_cole,
      order: 3,
      isVisible: true,
      data: {
        __type: 'kuppinger_cole',
        heading: {
          tr: 'KuppingerCole & Gartner tarafından tanınan siber güvenlik lideriyiz.',
          en: 'Recognized cybersecurity leader by KuppingerCole & Gartner.',
        },
        linkHref: 'https://www.kuppingercole.com',
      },
    },
  });

  await prisma.pageComponent.upsert({
    where: { id: IDS.component.homepage_why_kron },
    update: {},
    create: {
      id: IDS.component.homepage_why_kron,
      pageId: IDS.page.homepage,
      type: ComponentType.why_kron,
      order: 4,
      isVisible: true,
      data: {
        __type: 'why_kron',
        heading: { tr: 'Neden Krontech?', en: 'Why Krontech?' },
        items: [
          {
            title: { tr: 'Yerli ve Milli Teknoloji', en: 'Domestic Technology' },
            body: { tr: 'Türkiye\'nin lider siber güvenlik şirketi olarak yerli çözümler sunuyoruz.', en: 'As Turkey\'s leading cybersecurity company, we offer domestic solutions.' },
          },
          {
            title: { tr: 'Küresel Tanınırlık', en: 'Global Recognition' },
            body: { tr: 'KuppingerCole ve Gartner gibi bağımsız analistler tarafından lider olarak tanındık.', en: 'Recognized as a leader by independent analysts such as KuppingerCole and Gartner.' },
          },
          {
            title: { tr: '20 Yıllık Deneyim', en: '20 Years of Experience' },
            body: { tr: '20 yılı aşkın deneyimimizle kurumsal müşterilerimize güven veriyoruz.', en: 'We inspire confidence in our enterprise customers with over 20 years of experience.' },
          },
          {
            title: { tr: 'Kapsamlı Destek', en: 'Comprehensive Support' },
            body: { tr: '7/24 teknik destek ve profesyonel hizmetlerle yanınızdayız.', en: 'We are with you with 24/7 technical support and professional services.' },
          },
        ],
      },
    },
  });

  await prisma.pageComponent.upsert({
    where: { id: IDS.component.homepage_stats },
    update: {},
    create: {
      id: IDS.component.homepage_stats,
      pageId: IDS.page.homepage,
      type: ComponentType.stats_banner,
      order: 5,
      isVisible: true,
      data: {
        __type: 'stats_banner',
        stats: [
          { label: { tr: 'Kıta', en: 'Continents' }, value: '5' },
          { label: { tr: 'Ülke', en: 'Countries' }, value: '40+' },
          { label: { tr: 'İş Ortağı', en: 'Partners' }, value: '100+' },
          { label: { tr: 'Proje', en: 'Projects' }, value: '1500+' },
        ],
      },
    },
  });

  await prisma.pageComponent.upsert({
    where: { id: IDS.component.homepage_video },
    update: {},
    create: {
      id: IDS.component.homepage_video,
      pageId: IDS.page.homepage,
      type: ComponentType.video,
      order: 6,
      isVisible: true,
      data: {
        __type: 'video',
        videoId: 'Ag2dQLxBzdE',
      },
    },
  });

  await prisma.pageComponent.upsert({
    where: { id: IDS.component.homepage_blog },
    update: {},
    create: {
      id: IDS.component.homepage_blog,
      pageId: IDS.page.homepage,
      type: ComponentType.blog_carousel,
      order: 7,
      isVisible: true,
      data: { __type: 'blog_carousel' },
    },
  });

  await prisma.pageComponent.upsert({
    where: { id: IDS.component.homepage_contact },
    update: {},
    create: {
      id: IDS.component.homepage_contact,
      pageId: IDS.page.homepage,
      type: ComponentType.contact_section,
      order: 8,
      isVisible: true,
      data: {
        __type: 'contact_section',
        formId: IDS.form.contact,
      },
    },
  });

  // Contact page
  await prisma.pageComponent.upsert({
    where: { id: IDS.component.contact_hero },
    update: {
      data: {
        __type: 'hero',
        heading: { tr: 'İletişim', en: 'Contact' },
        subheading: { tr: 'Sorularınız için bize ulaşın; en kısa sürede dönüş yapacağız.', en: 'Reach out to us with your questions; we will get back to you as soon as possible.' },
      },
    },
    create: {
      id: IDS.component.contact_hero,
      pageId: IDS.page.contact,
      type: ComponentType.hero,
      order: 1,
      isVisible: true,
      data: {
        __type: 'hero',
        heading: { tr: 'İletişim', en: 'Contact' },
        subheading: { tr: 'Sorularınız için bize ulaşın; en kısa sürede dönüş yapacağız.', en: 'Reach out to us with your questions; we will get back to you as soon as possible.' },
      },
    },
  });

  await prisma.pageComponent.upsert({
    where: { id: IDS.component.contact_form },
    update: { data: { __type: 'form_embed', formId: contactForm.id, formSlug: 'contact' } },
    create: {
      id: IDS.component.contact_form,
      pageId: IDS.page.contact,
      type: ComponentType.form_embed,
      order: 2,
      isVisible: true,
      data: { __type: 'form_embed', formId: contactForm.id, formSlug: 'contact' },
    },
  });

  // Demo page
  await prisma.pageComponent.upsert({
    where: { id: IDS.component.demo_hero },
    update: {
      data: {
        __type: 'hero',
        heading: { tr: 'Demo Talebi', en: 'Request a Demo' },
        subheading: { tr: 'Ürünlerimizi canlı olarak deneyimlemek için demo talep edin.', en: 'Request a demo to experience our products live.' },
      },
    },
    create: {
      id: IDS.component.demo_hero,
      pageId: IDS.page.demo,
      type: ComponentType.hero,
      order: 1,
      isVisible: true,
      data: {
        __type: 'hero',
        heading: { tr: 'Demo Talebi', en: 'Request a Demo' },
        subheading: { tr: 'Ürünlerimizi canlı olarak deneyimlemek için demo talep edin.', en: 'Request a demo to experience our products live.' },
      },
    },
  });

  await prisma.pageComponent.upsert({
    where: { id: IDS.component.demo_form },
    update: { data: { __type: 'form_embed', formId: demoForm.id, formSlug: 'demo' } },
    create: {
      id: IDS.component.demo_form,
      pageId: IDS.page.demo,
      type: ComponentType.form_embed,
      order: 2,
      isVisible: true,
      data: { __type: 'form_embed', formId: demoForm.id, formSlug: 'demo' },
    },
  });

  // ─── Products (6 real Krontech products) ─────────────────────────────────────

  await prisma.seoMeta.upsert({
    where: { id: IDS.seo.pam },
    update: {},
    create: { id: IDS.seo.pam, metaTitle: { tr: 'PAM | Krontech', en: 'PAM | Krontech' }, metaDescription: { tr: 'Privileged Access Management çözümü', en: 'Privileged Access Management solution' }, robots: 'index, follow' },
  });
  await prisma.seoMeta.upsert({
    where: { id: IDS.seo.dam },
    update: {},
    create: { id: IDS.seo.dam, metaTitle: { tr: 'DAM | Krontech', en: 'DAM | Krontech' }, metaDescription: { tr: 'Database Activity Monitoring çözümü', en: 'Database Activity Monitoring solution' }, robots: 'index, follow' },
  });
  await prisma.seoMeta.upsert({
    where: { id: IDS.seo.ddm },
    update: {},
    create: { id: IDS.seo.ddm, metaTitle: { tr: 'DDM | Krontech', en: 'DDM | Krontech' }, metaDescription: { tr: 'Dynamic Data Masking çözümü', en: 'Dynamic Data Masking solution' }, robots: 'index, follow' },
  });
  await prisma.seoMeta.upsert({
    where: { id: IDS.seo.qa },
    update: {},
    create: { id: IDS.seo.qa, metaTitle: { tr: 'Query Analysis | Krontech', en: 'Query Analysis | Krontech' }, metaDescription: { tr: 'Query Analysis çözümü', en: 'Query Analysis solution' }, robots: 'index, follow' },
  });
  await prisma.seoMeta.upsert({
    where: { id: IDS.seo.aaa },
    update: {},
    create: { id: IDS.seo.aaa, metaTitle: { tr: 'AAA | Krontech', en: 'AAA | Krontech' }, metaDescription: { tr: 'AAA kimlik yönetimi çözümü', en: 'AAA identity management solution' }, robots: 'index, follow' },
  });
  await prisma.seoMeta.upsert({
    where: { id: IDS.seo.tlmp },
    update: {},
    create: { id: IDS.seo.tlmp, metaTitle: { tr: 'TLMP | Krontech', en: 'TLMP | Krontech' }, metaDescription: { tr: 'Technology License Management Platform', en: 'Technology License Management Platform' }, robots: 'index, follow' },
  });

  await prisma.product.upsert({
    where: { id: IDS.product.pam },
    update: { name: { tr: 'Privileged Access Management', en: 'Privileged Access Management' } },
    create: {
      id: IDS.product.pam,
      slug: { tr: 'pam', en: 'pam' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      name: { tr: 'Privileged Access Management', en: 'Privileged Access Management' },
      tagline: { tr: 'Ayrıcalıklı hesaplara erişimi merkezi olarak yönetin, denetleyin ve güvence altına alın.', en: 'Centrally manage, monitor, and secure access to privileged accounts.' },
      description: { tr: 'PAM (Privileged Access Management), kuruluşların ayrıcalıklı hesaplara ve erişim haklarına yönelik tehditleri korumasına yardımcı olan bir siber güvenlik stratejisidir.', en: 'PAM (Privileged Access Management) is a cybersecurity strategy that helps organizations protect against threats targeting privileged accounts and access rights.' },
      features: [
        { title: { tr: 'Merkezi hesap yönetimi', en: 'Centralized account management' }, description: { tr: 'Tüm ayrıcalıklı hesapları tek noktadan yönetin.', en: 'Manage all privileged accounts from a single point.' } },
        { title: { tr: 'Oturum kaydı ve izleme', en: 'Session recording and monitoring' }, description: { tr: 'Tüm ayrıcalıklı oturumları kaydedin ve izleyin.', en: 'Record and monitor all privileged sessions.' } },
        { title: { tr: 'Çift faktörlü kimlik doğrulama', en: 'Two-factor authentication' }, description: { tr: 'Ek güvenlik katmanı ile erişimi koruyun.', en: 'Protect access with an additional security layer.' } },
        { title: { tr: 'Parola kasası', en: 'Password vault' }, description: { tr: 'Parolaları şifreli kasada güvenle saklayın.', en: 'Securely store passwords in an encrypted vault.' } },
      ],
      seoMetaId: IDS.seo.pam,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.product.upsert({
    where: { id: IDS.product.dam },
    update: { name: { tr: 'Database Activity Monitoring', en: 'Database Activity Monitoring' } },
    create: {
      id: IDS.product.dam,
      slug: { tr: 'dam', en: 'dam' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      name: { tr: 'Database Activity Monitoring', en: 'Database Activity Monitoring' },
      tagline: { tr: 'Veritabanı aktivitelerini gerçek zamanlı olarak izleyin, anormalileri tespit edin.', en: 'Monitor database activities in real time and detect anomalies.' },
      description: { tr: 'DAM, veritabanlarına yapılan tüm erişimleri izleyerek yetkisiz işlemleri tespit eder.', en: 'DAM monitors all accesses to databases and detects unauthorized operations.' },
      features: [
        { title: { tr: 'Gerçek zamanlı izleme', en: 'Real-time monitoring' }, description: { tr: 'Veritabanı aktivitelerini anlık olarak izleyin.', en: 'Monitor database activities in real time.' } },
        { title: { tr: 'Anormallik tespiti', en: 'Anomaly detection' }, description: { tr: 'Şüpheli davranışları otomatik tespit edin.', en: 'Automatically detect suspicious behavior.' } },
        { title: { tr: 'Kapsamlı raporlama', en: 'Comprehensive reporting' }, description: { tr: 'Detaylı denetim raporları oluşturun.', en: 'Generate detailed audit reports.' } },
        { title: { tr: 'Uyumluluk desteği', en: 'Compliance support' }, description: { tr: 'KVKK, GDPR ve diğer düzenlemelere uyum.', en: 'Compliance with KVKK, GDPR, and other regulations.' } },
      ],
      seoMetaId: IDS.seo.dam,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.product.upsert({
    where: { id: IDS.product.ddm },
    update: { name: { tr: 'Dynamic Data Masking', en: 'Dynamic Data Masking' } },
    create: {
      id: IDS.product.ddm,
      slug: { tr: 'ddm', en: 'ddm' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      name: { tr: 'Dynamic Data Masking', en: 'Dynamic Data Masking' },
      tagline: { tr: 'Hassas verileri yetkisiz kullanıcılardan gizleyin, GDPR ve KVKK uyumluluğunu sağlayın.', en: 'Hide sensitive data from unauthorized users, ensure GDPR and compliance.' },
      description: { tr: 'DDM, veritabanı sorgularını gerçek zamanlı olarak değiştirerek hassas verileri maskeler.', en: 'DDM modifies database queries in real time to mask sensitive data.' },
      features: [
        { title: { tr: 'Gerçek zamanlı maskeleme', en: 'Real-time masking' }, description: { tr: 'Sorgular sırasında verileri anlık maskeleyin.', en: 'Mask data instantly during queries.' } },
        { title: { tr: 'KVKK uyumluluğu', en: 'KVKK compliance' }, description: { tr: 'Türk veri koruma mevzuatına tam uyum.', en: 'Full compliance with Turkish data protection law.' } },
        { title: { tr: 'Rol tabanlı erişim', en: 'Role-based access' }, description: { tr: 'Kullanıcı rolüne göre veri görünürlüğünü kontrol edin.', en: 'Control data visibility based on user role.' } },
        { title: { tr: 'Uygulama şeffaflığı', en: 'Application transparency' }, description: { tr: 'Uygulamalarda değişiklik gerektirmez.', en: 'No application changes required.' } },
      ],
      seoMetaId: IDS.seo.ddm,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.product.upsert({
    where: { id: IDS.product.qa },
    update: { name: { tr: 'Query Analysis', en: 'Query Analysis' } },
    create: {
      id: IDS.product.qa,
      slug: { tr: 'qa', en: 'qa' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      name: { tr: 'Query Analysis', en: 'Query Analysis' },
      tagline: { tr: 'SQL enjeksiyon saldırılarını tespit edin, veritabanı sorgularını analiz edin.', en: 'Detect SQL injection attacks and analyze database queries.' },
      description: { tr: 'QA, SQL enjeksiyon, yetkisiz veri erişimi ve anormal sorgu paternlerini engeller.', en: 'QA blocks SQL injection, unauthorized data access, and abnormal query patterns.' },
      features: [
        { title: { tr: 'SQL enjeksiyon tespiti', en: 'SQL injection detection' }, description: { tr: 'Saldırıları milisaniyeler içinde tespit edin.', en: 'Detect attacks within milliseconds.' } },
        { title: { tr: 'Sorgu davranış analizi', en: 'Query behavior analysis' }, description: { tr: 'Normal ve anormal sorgu kalıplarını öğrenin.', en: 'Learn normal and abnormal query patterns.' } },
        { title: { tr: 'Otomatik engelleme', en: 'Automatic blocking' }, description: { tr: 'Tehlikeli sorgular otomatik engellenir.', en: 'Dangerous queries are automatically blocked.' } },
        { title: { tr: 'Detaylı loglama', en: 'Detailed logging' }, description: { tr: 'Her sorgu için kapsamlı kayıt tutun.', en: 'Maintain comprehensive records for every query.' } },
      ],
      seoMetaId: IDS.seo.qa,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.product.upsert({
    where: { id: IDS.product.aaa },
    update: { name: { tr: 'AAA', en: 'AAA' } },
    create: {
      id: IDS.product.aaa,
      slug: { tr: 'aaa', en: 'aaa' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      name: { tr: 'AAA', en: 'AAA' },
      tagline: { tr: 'Authentication, Authorization ve Accounting ile kimlik yönetimini merkezi hale getirin.', en: 'Centralize identity management with Authentication, Authorization, and Accounting.' },
      description: { tr: 'AAA çözümü kimlik doğrulama, yetkilendirme ve hesap tutma hizmetlerini merkezi olarak sağlar.', en: 'The AAA solution centrally provides authentication, authorization, and accounting services.' },
      features: [
        { title: { tr: 'Merkezi kimlik yönetimi', en: 'Centralized identity management' }, description: { tr: 'Tüm kullanıcı kimliklerini tek yerden yönetin.', en: 'Manage all user identities from one place.' } },
        { title: { tr: 'Çok faktörlü doğrulama', en: 'Multi-factor authentication' }, description: { tr: 'MFA ile erişim güvenliğini artırın.', en: 'Enhance access security with MFA.' } },
        { title: { tr: 'LDAP/AD entegrasyonu', en: 'LDAP/AD integration' }, description: { tr: 'Mevcut dizin servisleriyle sorunsuz entegrasyon.', en: 'Seamless integration with existing directory services.' } },
        { title: { tr: 'Kapsamlı denetim izi', en: 'Comprehensive audit trail' }, description: { tr: 'Tüm erişim olaylarını kayıt altına alın.', en: 'Record all access events.' } },
      ],
      seoMetaId: IDS.seo.aaa,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  await prisma.product.upsert({
    where: { id: IDS.product.tlmp },
    update: { name: { tr: 'TLMP', en: 'TLMP' } },
    create: {
      id: IDS.product.tlmp,
      slug: { tr: 'tlmp', en: 'tlmp' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      name: { tr: 'TLMP', en: 'TLMP' },
      tagline: { tr: 'Teknoloji lisans yönetimini otomatikleştirin, maliyetlerinizi optimize edin.', en: 'Automate technology license management and optimize your costs.' },
      description: { tr: 'TLMP kurumsal yazılım lisanslarının takibini, yönetimini ve maliyet optimizasyonunu otomatikleştirir.', en: 'TLMP automates tracking, management, and cost optimization of enterprise software licenses.' },
      features: [
        { title: { tr: 'Otomatik lisans takibi', en: 'Automated license tracking' }, description: { tr: 'Tüm lisanslarınızı otomatik izleyin.', en: 'Automatically track all your licenses.' } },
        { title: { tr: 'Maliyet optimizasyonu', en: 'Cost optimization' }, description: { tr: 'Gereksiz lisans harcamalarını ortadan kaldırın.', en: 'Eliminate unnecessary license costs.' } },
        { title: { tr: 'Uyumluluk raporlaması', en: 'Compliance reporting' }, description: { tr: 'Lisans uyumluluk raporları oluşturun.', en: 'Generate license compliance reports.' } },
        { title: { tr: 'Yazılım kullanım analizi', en: 'Software usage analysis' }, description: { tr: 'Hangi yazılımların kullanıldığını analiz edin.', en: 'Analyze which software is actually being used.' } },
      ],
      seoMetaId: IDS.seo.tlmp,
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  // ─── Product media ────────────────────────────────────────────────────────────

  for (const [productId, mediaId, filename] of PRODUCT_MEDIA_MANIFEST) {
    await upsertProductMedia(productId, mediaId, filename, admin.id);
  }

  // ─── Blog media ───────────────────────────────────────────────────────────────

  for (const [, mediaId, filename] of BLOG_MEDIA_MANIFEST) {
    await upsertBlogMedia(mediaId, filename, admin.id);
  }

  // ─── Blog posts ───────────────────────────────────────────────────────────────

  const category = await prisma.category.upsert({
    where: { slug: 'teknoloji' },
    update: {},
    create: { slug: 'teknoloji', name: { tr: 'Teknoloji', en: 'Technology' } },
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

  const seoPosts = await Promise.all([
    prisma.seoMeta.upsert({ where: { id: IDS.seo.post1 }, update: {}, create: { id: IDS.seo.post1, metaTitle: { tr: 'NestJS ile API Geliştirme', en: 'API Development with NestJS' }, metaDescription: { tr: 'NestJS rehberi', en: 'NestJS guide' }, robots: 'index, follow' } }),
    prisma.seoMeta.upsert({ where: { id: IDS.seo.post2 }, update: {}, create: { id: IDS.seo.post2, metaTitle: { tr: 'Prisma ile Veritabanı', en: 'Database with Prisma' }, metaDescription: { tr: 'Prisma rehberi', en: 'Prisma guide' }, robots: 'index, follow' } }),
    prisma.seoMeta.upsert({ where: { id: IDS.seo.post3 }, update: {}, create: { id: IDS.seo.post3, metaTitle: { tr: 'TypeScript İpuçları', en: 'TypeScript Tips' }, metaDescription: { tr: 'TypeScript ipuçları', en: 'TypeScript tips' }, robots: 'index, follow' } }),
    prisma.seoMeta.upsert({ where: { id: IDS.seo.post4 }, update: {}, create: { id: IDS.seo.post4, metaTitle: { tr: 'Docker ile Deployment', en: 'Deployment with Docker' }, metaDescription: { tr: 'Docker rehberi', en: 'Docker guide' }, robots: 'noindex, nofollow' } }),
    prisma.seoMeta.upsert({ where: { id: IDS.seo.post5 }, update: {}, create: { id: IDS.seo.post5, metaTitle: { tr: 'JWT Güvenliği', en: 'JWT Security' }, metaDescription: { tr: 'JWT güvenlik rehberi', en: 'JWT security guide' }, robots: 'noindex, nofollow' } }),
  ]);

  const postBodies = {
    p1: {
      tr: '## NestJS ile API Geliştirme\n\nNestJS, TypeScript tabanlı, ölçeklenebilir ve bakımı kolay sunucu taraflı uygulamalar oluşturmak için tasarlanmış güçlü bir Node.js framework\'üdür. Angular\'dan ilham alan modüler mimarisi, büyük ekiplerin kod tabanını düzenli tutmasını sağlar.\n\n### Neden NestJS?\n\nNestJS, dependency injection, middleware, guard ve interceptor gibi kurumsal yazılım desenlerini birinci sınıf destek olarak sunar. Bu sayede kimlik doğrulama, yetkilendirme ve loglama gibi kesişen kaygılar kolayca ayrıştırılabilir.\n\n### Temel Kavramlar\n\n**Modüller:** Uygulamayı işlevsel bloklara ayırır. Her özellik kendi modülüne sahip olur.\n\n**Controller\'lar:** HTTP isteklerini karşılar ve servis katmanına yönlendirir.\n\n**Servisler:** İş mantığını barındırır ve controller\'lardan bağımsız test edilebilir.\n\n**DTO\'lar ve Validation Pipe:** Gelen veriyi `class-validator` ile doğrular; geçersiz istekler otomatik olarak reddedilir.\n\n### Sonuç\n\nNestJS, özellikle kurumsal ölçekteki REST ve GraphQL API\'leri için kanıtlanmış bir seçimdir. Güçlü ekosistemi, kapsamlı dökümantasyonu ve TypeScript desteği ile üretim ortamında güvenle kullanılabilir.',
      en: '## API Development with NestJS\n\nNestJS is a powerful Node.js framework designed for building scalable and maintainable server-side applications with TypeScript. Its modular architecture, inspired by Angular, helps large teams keep their codebase organized.\n\n### Why NestJS?\n\nNestJS offers enterprise software patterns such as dependency injection, middleware, guards, and interceptors as first-class citizens. This makes it easy to separate cross-cutting concerns like authentication, authorization, and logging.\n\n### Core Concepts\n\n**Modules:** Split the application into functional blocks. Each feature owns its module.\n\n**Controllers:** Receive HTTP requests and delegate to the service layer.\n\n**Services:** Hold business logic and can be tested independently of controllers.\n\n**DTOs and Validation Pipe:** Validate incoming data with `class-validator`; invalid requests are automatically rejected.\n\n### Conclusion\n\nNestJS is a proven choice, especially for enterprise-scale REST and GraphQL APIs. With its rich ecosystem, comprehensive documentation, and TypeScript support, it can be confidently used in production.',
    },
    p2: {
      tr: '## Prisma ile Veritabanı Yönetimi\n\nPrisma, modern TypeScript projelerinde veritabanı işlemlerini tip-güvenli ve sezgisel bir şekilde gerçekleştirmeyi sağlayan açık kaynaklı bir ORM\'dir. Geleneksel ORM\'lerin aksine, Prisma şema dosyasından otomatik olarak TypeScript tipleri üretir.\n\n### Prisma\'nın Avantajları\n\n**Tip Güvenliği:** Prisma Client, veritabanı şemasından türetilen tipler sayesinde derleme zamanında hataları yakalar. Yanlış alan adı veya tip uyuşmazlığı geliştirme ortamında hemen fark edilir.\n\n**Okunabilir Sorgular:** Zincirleme API sayesinde karmaşık JOIN\'ler ve filtrelemeler okunabilir bir sözdizimi ile yazılır.\n\n**Migrations:** `prisma migrate dev` komutu şema değişikliklerini otomatik olarak SQL migration\'larına dönüştürür ve versiyon kontrolüne ekler.\n\n### Dikkat Edilmesi Gerekenler\n\nPrisma\'nın `findMany` sorguları varsayılan olarak tüm alanları döndürür. Performans açısından kritik endpoint\'lerde `select` ile yalnızca ihtiyaç duyulan alanlar çekilmelidir.\n\n### Sonuç\n\nPrisma, NestJS ve Next.js gibi modern TypeScript stack\'leriyle mükemmel entegrasyon sunar. Hem küçük projelerde hem de büyük ölçekli uygulamalarda tercih edilen bir araç haline gelmiştir.',
      en: '## Database Management with Prisma\n\nPrisma is an open-source ORM that enables type-safe and intuitive database operations in modern TypeScript projects. Unlike traditional ORMs, Prisma automatically generates TypeScript types from its schema file.\n\n### Advantages of Prisma\n\n**Type Safety:** Prisma Client catches errors at compile time thanks to types derived from the database schema. Incorrect field names or type mismatches are noticed immediately during development.\n\n**Readable Queries:** Complex JOINs and filters are written with a readable syntax through the chaining API.\n\n**Migrations:** The `prisma migrate dev` command automatically converts schema changes into SQL migrations and adds them to version control.\n\n### Things to Watch Out For\n\nPrisma\'s `findMany` queries return all fields by default. For performance-critical endpoints, only the necessary fields should be fetched using `select`.\n\n### Conclusion\n\nPrisma offers excellent integration with modern TypeScript stacks like NestJS and Next.js. It has become the go-to tool for both small projects and large-scale applications.',
    },
    p3: {
      tr: '## TypeScript İpuçları\n\nTypeScript, JavaScript\'e statik tip sistemi ekleyerek büyük kod tabanlarında hataları erken aşamada yakalamayı sağlar. Doğru kullanıldığında geliştirici deneyimini ve kod kalitesini önemli ölçüde artırır.\n\n### Tip Daraltma (Type Narrowing)\n\n`typeof`, `instanceof` ve özel tip koruyucular (`type guard`) sayesinde TypeScript, bir değişkenin hangi tip olduğunu bağlama göre otomatik olarak daraltır. Bu, gereksiz tür dönüşümlerinden kaçınmanın en temiz yoludur.\n\n### `satisfies` Operatörü\n\nTypeScript 4.9 ile gelen `satisfies`, bir nesnenin belirli bir tipe uyduğunu doğrularken orijinal tipin çıkarımını korur. Bu sayede hem tip güvenliği sağlanır hem de IDE otomatik tamamlama tam anlamıyla çalışır.\n\n### Template Literal Tipleri\n\nString birleştirme desenleri için güçlü bir özellik. Örneğin API rotalarını veya olay isimlerini tip sistemiyle doğrulamak mümkündür.\n\n### `as const` ile Sabit Tipler\n\nBir nesne veya dizi literali `as const` ile işaretlendiğinde TypeScript en dar tipi çıkarır. Konfigürasyon nesneleri ve sabit veri yapıları için idealdir.\n\n### Sonuç\n\nTypeScript\'in sunduğu araçları doğru kullanmak, hem daha az runtime hatası hem de daha anlaşılır bir kod tabanı anlamına gelir.',
      en: '## TypeScript Tips\n\nTypeScript adds a static type system to JavaScript, enabling early error detection in large codebases. When used correctly, it significantly improves developer experience and code quality.\n\n### Type Narrowing\n\nUsing `typeof`, `instanceof`, and custom type guards, TypeScript automatically narrows down the type of a variable based on context. This is the cleanest way to avoid unnecessary type assertions.\n\n### The `satisfies` Operator\n\nIntroduced in TypeScript 4.9, `satisfies` validates that an object conforms to a type while preserving the original inferred type. This gives both type safety and full IDE autocompletion.\n\n### Template Literal Types\n\nA powerful feature for string concatenation patterns. It\'s possible to validate API routes or event names using the type system.\n\n### Immutable Types with `as const`\n\nWhen an object or array literal is annotated with `as const`, TypeScript infers the narrowest possible type. Ideal for configuration objects and constant data structures.\n\n### Conclusion\n\nUsing TypeScript\'s tools correctly means fewer runtime errors and a more readable codebase.',
    },
    p4: {
      tr: '## Docker ile Deployment\n\nDocker, uygulamaları bağımlılıklarıyla birlikte izole konteynerler içinde paketleyerek "bende çalışıyor" sorununu ortadan kaldırır. Geliştirme, test ve üretim ortamları arasındaki tutarsızlıklar Docker ile minimize edilir.\n\n### Temel Kavramlar\n\n**Image:** Uygulamanın değiştirilemez anlık görüntüsü. Dockerfile ile tanımlanır.\n\n**Konteyner:** Image\'dan oluşturulan çalışan örnek. Birden fazla konteyner aynı image\'dan başlatılabilir.\n\n**Volume:** Konteyner yeniden başlatıldığında verinin kaybolmaması için kalıcı depolama alanı.\n\n### Multi-Stage Build\n\nÜretim image\'larını küçük tutmak için multi-stage build kullanılmalıdır. Derleme araçları yalnızca build aşamasında bulunur; final image yalnızca çalışma zamanı bağımlılıklarını içerir.\n\n### Docker Compose ile Yerel Ortam\n\n`docker-compose.yml` dosyası, API, veritabanı, cache ve diğer servisler arasındaki ilişkiyi tanımlar. Tek komutla (`docker compose up`) tüm ortam ayağa kalkar.\n\n### Sonuç\n\nDocker, modern yazılım geliştirme süreçlerinde vazgeçilmez bir araç haline gelmiştir. CI/CD pipeline\'larına entegrasyonu ve Kubernetes gibi orkestrasyon araçlarıyla uyumu onu üretim ortamları için ideal kılar.',
      en: '## Deployment with Docker\n\nDocker eliminates the "it works on my machine" problem by packaging applications with their dependencies in isolated containers. Inconsistencies between development, test, and production environments are minimized with Docker.\n\n### Core Concepts\n\n**Image:** An immutable snapshot of the application. Defined with a Dockerfile.\n\n**Container:** A running instance created from an image. Multiple containers can be started from the same image.\n\n**Volume:** Persistent storage so data is not lost when a container restarts.\n\n### Multi-Stage Build\n\nMulti-stage builds should be used to keep production images small. Build tools are only present during the build stage; the final image contains only runtime dependencies.\n\n### Local Environment with Docker Compose\n\nThe `docker-compose.yml` file defines relationships between the API, database, cache, and other services. The entire environment starts with a single command (`docker compose up`).\n\n### Conclusion\n\nDocker has become an indispensable tool in modern software development. Its integration with CI/CD pipelines and compatibility with orchestration tools like Kubernetes makes it ideal for production environments.',
    },
    p5: {
      tr: '## JWT Güvenliği\n\nJSON Web Token (JWT), taraflar arasında bilgiyi güvenli bir şekilde iletmek için kullanılan kompakt ve kendi kendine yeten bir standarttır. Doğru uygulandığında etkili bir kimlik doğrulama mekanizması sağlar; ancak yaygın hatalar ciddi güvenlik açıklarına yol açabilir.\n\n### JWT Yapısı\n\nJWT üç bölümden oluşur: **Header** (algoritma ve token tipi), **Payload** (claim\'ler) ve **Signature** (doğrulama imzası). Her bölüm Base64URL ile kodlanır ve nokta (`.`) ile ayrılır.\n\n### Yaygın Güvenlik Hataları\n\n**`alg: none` saldırısı:** Bazı kütüphaneler imzasız token\'ları kabul eder. Sunucu tarafında algoritma her zaman açıkça doğrulanmalıdır.\n\n**Zayıf secret:** Kısa veya tahmin edilebilir secret\'lar brute-force saldırılarına karşı savunmasızdır. En az 256-bit rastgele bir değer kullanılmalıdır.\n\n**Uzun süreli token\'lar:** Access token\'ların ömrü kısa tutulmalı (15 dakika), uzun süreli oturumlar için refresh token mekanizması kullanılmalıdır.\n\n### Token Saklama\n\nAccess token\'ları `HttpOnly` cookie\'lerde saklamak, XSS saldırılarına karşı `localStorage`\'dan çok daha güvenlidir.\n\n### Sonuç\n\nJWT, doğru yapılandırıldığında güçlü bir kimlik doğrulama çözümüdür. Ancak varsayılan ayarlarla kullanmak yerine, her parametre bilinçli olarak seçilmelidir.',
      en: '## JWT Security\n\nJSON Web Token (JWT) is a compact, self-contained standard used to securely transmit information between parties. When implemented correctly, it provides an effective authentication mechanism; however, common mistakes can lead to serious security vulnerabilities.\n\n### JWT Structure\n\nJWT consists of three parts: **Header** (algorithm and token type), **Payload** (claims), and **Signature** (verification signature). Each part is Base64URL-encoded and separated by a dot (`.`).\n\n### Common Security Mistakes\n\n**`alg: none` attack:** Some libraries accept unsigned tokens. The algorithm must always be explicitly validated on the server side.\n\n**Weak secret:** Short or predictable secrets are vulnerable to brute-force attacks. At least 256 bits of random entropy should be used.\n\n**Long-lived tokens:** Access token lifetimes should be kept short (15 minutes); a refresh token mechanism should be used for long-lived sessions.\n\n### Token Storage\n\nStoring access tokens in `HttpOnly` cookies is far safer against XSS attacks than `localStorage`.\n\n### Conclusion\n\nJWT is a powerful authentication solution when configured correctly. Rather than using default settings, every parameter should be chosen deliberately.',
    },
  };

  await prisma.blogPost.upsert({
    where: { id: IDS.post.p1 },
    update: { body: postBodies.p1, featuredImageId: IDS.media.blog_post1 },
    create: { id: IDS.post.p1, slug: { tr: 'nestjs-ile-api-gelistirme', en: 'api-development-with-nestjs' }, status: ContentStatus.PUBLISHED, publishedAt: new Date('2026-01-10'), title: { tr: 'NestJS ile API Geliştirme', en: 'API Development with NestJS' }, excerpt: { tr: 'NestJS ile modern API nasıl inşa edilir.', en: 'How to build a modern API with NestJS.' }, body: postBodies.p1, readingTimeMinutes: 5, authorId: admin.id, categoryId: category.id, tags: { connect: [{ id: tag1.id }] }, featuredImageId: IDS.media.blog_post1, seoMetaId: seoPosts[0]!.id, createdById: admin.id, updatedById: admin.id },
  });
  await prisma.blogPost.upsert({
    where: { id: IDS.post.p2 },
    update: { body: postBodies.p2, featuredImageId: IDS.media.blog_post2 },
    create: { id: IDS.post.p2, slug: { tr: 'prisma-ile-veritabani', en: 'database-with-prisma' }, status: ContentStatus.PUBLISHED, publishedAt: new Date('2026-01-20'), title: { tr: 'Prisma ile Veritabanı Yönetimi', en: 'Database Management with Prisma' }, excerpt: { tr: 'Prisma ORM ile tip-güvenli veritabanı işlemleri.', en: 'Type-safe database operations with Prisma ORM.' }, body: postBodies.p2, readingTimeMinutes: 7, authorId: admin.id, categoryId: category.id, tags: { connect: [{ id: tag2.id }] }, featuredImageId: IDS.media.blog_post2, seoMetaId: seoPosts[1]!.id, createdById: admin.id, updatedById: admin.id },
  });
  await prisma.blogPost.upsert({
    where: { id: IDS.post.p3 },
    update: { body: postBodies.p3, featuredImageId: IDS.media.blog_post3 },
    create: { id: IDS.post.p3, slug: { tr: 'typescript-ipuclari', en: 'typescript-tips' }, status: ContentStatus.PUBLISHED, publishedAt: new Date('2026-02-01'), title: { tr: 'TypeScript İpuçları', en: 'TypeScript Tips' }, excerpt: { tr: 'Üretkenliğinizi artıracak TypeScript ipuçları.', en: 'TypeScript tips to boost your productivity.' }, body: postBodies.p3, readingTimeMinutes: 4, authorId: admin.id, categoryId: category.id, tags: { connect: [{ id: tag1.id }, { id: tag2.id }] }, featuredImageId: IDS.media.blog_post3, seoMetaId: seoPosts[2]!.id, createdById: admin.id, updatedById: admin.id },
  });
  await prisma.blogPost.upsert({
    where: { id: IDS.post.p4 },
    update: { body: postBodies.p4, featuredImageId: IDS.media.blog_post4 },
    create: { id: IDS.post.p4, slug: { tr: 'docker-ile-deployment', en: 'deployment-with-docker' }, status: ContentStatus.DRAFT, title: { tr: 'Docker ile Deployment', en: 'Deployment with Docker' }, excerpt: { tr: 'Docker ile production deployment rehberi.', en: 'Production deployment guide with Docker.' }, body: postBodies.p4, readingTimeMinutes: 6, authorId: admin.id, categoryId: category.id, featuredImageId: IDS.media.blog_post4, seoMetaId: seoPosts[3]!.id, createdById: admin.id, updatedById: admin.id },
  });
  await prisma.blogPost.upsert({
    where: { id: IDS.post.p5 },
    update: { body: postBodies.p5, featuredImageId: IDS.media.blog_post5 },
    create: { id: IDS.post.p5, slug: { tr: 'jwt-guvenligi', en: 'jwt-security' }, status: ContentStatus.DRAFT, title: { tr: 'JWT Güvenliği', en: 'JWT Security' }, excerpt: { tr: 'JWT token güvenliği için en iyi pratikler.', en: 'Best practices for JWT token security.' }, body: postBodies.p5, readingTimeMinutes: 8, authorId: admin.id, featuredImageId: IDS.media.blog_post5, seoMetaId: seoPosts[4]!.id, createdById: admin.id, updatedById: admin.id },
  });

  // ─── Redirects ────────────────────────────────────────────────────────────────

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
  // ─── Navigation items ─────────────────────────────────────────────────────────

  // Turkish navigation
  await prisma.navigationItem.upsert({
    where: { id: IDS.nav.tr_products },
    update: { label: 'Ürünler', order: 1 },
    create: { id: IDS.nav.tr_products, locale: 'tr', label: 'Ürünler', href: null, order: 1, isActive: true },
  });
  // Turkish product children
  const trProductChildren = [
    { id: IDS.nav.tr_pam,  label: 'PAM',          href: '/tr/products/pam',  order: 1 },
    { id: IDS.nav.tr_dam,  label: 'DAM',          href: '/tr/products/dam',  order: 2 },
    { id: IDS.nav.tr_ddm,  label: 'DDM',          href: '/tr/products/ddm',  order: 3 },
    { id: IDS.nav.tr_qa,   label: 'Query Analysis', href: '/tr/products/qa', order: 4 },
    { id: IDS.nav.tr_aaa,  label: 'AAA',          href: '/tr/products/aaa',  order: 5 },
    { id: IDS.nav.tr_tlmp, label: 'TLMP',         href: '/tr/products/tlmp', order: 6 },
  ];
  for (const child of trProductChildren) {
    await prisma.navigationItem.upsert({
      where: { id: child.id },
      update: { label: child.label, href: child.href, order: child.order },
      create: { id: child.id, locale: 'tr', label: child.label, href: child.href, order: child.order, parentId: IDS.nav.tr_products, isActive: true },
    });
  }
  // Turkish top-level items
  const trTopLevel = [
    { id: IDS.nav.tr_resources, label: 'Kaynaklar',    href: '/tr/resources',   order: 2 },
    { id: IDS.nav.tr_blog,      label: 'Blog',         href: '/tr/blog',        order: 3 },
    { id: IDS.nav.tr_contact,   label: 'İletişim',    href: '/tr/iletisim',    order: 4 },
    { id: IDS.nav.tr_demo,      label: 'Demo Talebi', href: '/tr/demo',        order: 5 },
  ];
  for (const item of trTopLevel) {
    await prisma.navigationItem.upsert({
      where: { id: item.id },
      update: { label: item.label, href: item.href, order: item.order },
      create: { id: item.id, locale: 'tr', label: item.label, href: item.href, order: item.order, isActive: true },
    });
  }

  // English navigation
  await prisma.navigationItem.upsert({
    where: { id: IDS.nav.en_products },
    update: { label: 'Products', order: 1 },
    create: { id: IDS.nav.en_products, locale: 'en', label: 'Products', href: null, order: 1, isActive: true },
  });
  const enProductChildren = [
    { id: IDS.nav.en_pam,  label: 'PAM',          href: '/en/products/pam',  order: 1 },
    { id: IDS.nav.en_dam,  label: 'DAM',          href: '/en/products/dam',  order: 2 },
    { id: IDS.nav.en_ddm,  label: 'DDM',          href: '/en/products/ddm',  order: 3 },
    { id: IDS.nav.en_qa,   label: 'Query Analysis', href: '/en/products/qa', order: 4 },
    { id: IDS.nav.en_aaa,  label: 'AAA',          href: '/en/products/aaa',  order: 5 },
    { id: IDS.nav.en_tlmp, label: 'TLMP',         href: '/en/products/tlmp', order: 6 },
  ];
  for (const child of enProductChildren) {
    await prisma.navigationItem.upsert({
      where: { id: child.id },
      update: { label: child.label, href: child.href, order: child.order },
      create: { id: child.id, locale: 'en', label: child.label, href: child.href, order: child.order, parentId: IDS.nav.en_products, isActive: true },
    });
  }
  const enTopLevel = [
    { id: IDS.nav.en_resources, label: 'Resources',    href: '/en/resources', order: 2 },
    { id: IDS.nav.en_blog,      label: 'Blog',         href: '/en/blog',      order: 3 },
    { id: IDS.nav.en_contact,   label: 'Contact',      href: '/en/contact',   order: 4 },
    { id: IDS.nav.en_demo,      label: 'Request Demo', href: '/en/demo',      order: 5 },
  ];
  for (const item of enTopLevel) {
    await prisma.navigationItem.upsert({
      where: { id: item.id },
      update: { label: item.label, href: item.href, order: item.order },
      create: { id: item.id, locale: 'en', label: item.label, href: item.href, order: item.order, isActive: true },
    });
  }

  console.log('✓ Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
