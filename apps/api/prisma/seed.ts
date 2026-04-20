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
    about:     '20000000-0000-0000-0000-000000000002',
    contact:   '20000000-0000-0000-0000-000000000003',
    demo:      '20000000-0000-0000-0000-000000000004',
    resources: '20000000-0000-0000-0000-000000000005',
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
    about:     '10000000-0000-0000-0000-000000000002',
    contact:   '10000000-0000-0000-0000-000000000003',
    demo:      '10000000-0000-0000-0000-000000000004',
    resources: '10000000-0000-0000-0000-000000000005',
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
    about_hero:         'c0000000-0000-0000-0000-000000000011',
    about_features:     'c0000000-0000-0000-0000-000000000012',
    about_cta:          'c0000000-0000-0000-0000-000000000013',
    contact_hero:       'c0000000-0000-0000-0000-000000000021',
    contact_form:       'c0000000-0000-0000-0000-000000000022',
    demo_hero:          'c0000000-0000-0000-0000-000000000031',
    demo_form:          'c0000000-0000-0000-0000-000000000032',
    resources_hero:     'c0000000-0000-0000-0000-000000000041',
    resources_features: 'c0000000-0000-0000-0000-000000000042',
    resources_cta:      'c0000000-0000-0000-0000-000000000043',
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
    tr_about:     'a0000000-0000-0000-0000-000000000010',
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
    en_about:     'a0000000-0000-0000-0000-000000000030',
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
    where: { id: IDS.seo.about },
    update: { metaTitle: { tr: 'Hakkımızda | Krontech', en: 'About Us | Krontech' } },
    create: {
      id: IDS.seo.about,
      metaTitle: { tr: 'Hakkımızda | Krontech', en: 'About Us | Krontech' },
      metaDescription: { tr: 'Krontech hakkında — misyon, vizyon ve değerlerimiz.', en: 'About Krontech — our mission, vision, and values.' },
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

  await prisma.seoMeta.upsert({
    where: { id: IDS.seo.resources },
    update: { metaTitle: { tr: 'Kaynaklar | Krontech', en: 'Resources | Krontech' } },
    create: {
      id: IDS.seo.resources,
      metaTitle: { tr: 'Kaynaklar | Krontech', en: 'Resources | Krontech' },
      metaDescription: { tr: 'Krontech kaynakları, teknik belgeler ve vaka çalışmaları.', en: 'Krontech resources, technical documents and case studies.' },
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
    where: { id: IDS.page.about },
    update: { slug: { tr: 'hakkimizda', en: 'about-us' } },
    create: {
      id: IDS.page.about,
      slug: { tr: 'hakkimizda', en: 'about-us' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      seoMetaId: IDS.seo.about,
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

  await prisma.page.upsert({
    where: { id: IDS.page.resources },
    update: { slug: { tr: 'resources', en: 'resources' } },
    create: {
      id: IDS.page.resources,
      slug: { tr: 'resources', en: 'resources' },
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      seoMetaId: IDS.seo.resources,
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
        videoId: 'dQw4w9WgXcQ',
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

  // About page
  await prisma.pageComponent.upsert({
    where: { id: IDS.component.about_hero },
    update: {
      data: {
        __type: 'hero',
        heading: { tr: 'Hakkımızda', en: 'About Us' },
        subheading: { tr: 'Kuruluşları siber tehditlerden koruyarak dijital dönüşümlerini güvenle tamamlamalarına yardımcı oluyoruz.', en: 'Helping organizations complete their digital transformation securely by protecting them from cyber threats.' },
      },
    },
    create: {
      id: IDS.component.about_hero,
      pageId: IDS.page.about,
      type: ComponentType.hero,
      order: 1,
      isVisible: true,
      data: {
        __type: 'hero',
        heading: { tr: 'Hakkımızda', en: 'About Us' },
        subheading: { tr: 'Kuruluşları siber tehditlerden koruyarak dijital dönüşümlerini güvenle tamamlamalarına yardımcı oluyoruz.', en: 'Helping organizations complete their digital transformation securely by protecting them from cyber threats.' },
      },
    },
  });

  await prisma.pageComponent.upsert({
    where: { id: IDS.component.about_features },
    update: {
      data: {
        __type: 'features_grid',
        items: [
          {
            icon: '🎯',
            title: { tr: 'Misyonumuz', en: 'Our Mission' },
            description: { tr: 'Kuruluşları siber tehditlerden koruyarak dijital dönüşümlerini güvenle tamamlamalarına yardımcı olmak.', en: 'Helping organizations complete their digital transformation securely by protecting them from cyber threats.' },
          },
          {
            icon: '🌍',
            title: { tr: 'Vizyonumuz', en: 'Our Vision' },
            description: { tr: 'Küresel ölçekte tanınan, yerli ve milli bir siber güvenlik şirketi olmak.', en: 'To become a globally recognized domestic cybersecurity company.' },
          },
          {
            icon: '💎',
            title: { tr: 'Değerlerimiz', en: 'Our Values' },
            description: { tr: 'Dürüstlük, yenilikçilik, müşteri odaklılık ve sürekli gelişim.', en: 'Integrity, innovation, customer focus, and continuous improvement.' },
          },
        ],
      },
    },
    create: {
      id: IDS.component.about_features,
      pageId: IDS.page.about,
      type: ComponentType.features_grid,
      order: 2,
      isVisible: true,
      data: {
        __type: 'features_grid',
        items: [
          {
            icon: '🎯',
            title: { tr: 'Misyonumuz', en: 'Our Mission' },
            description: { tr: 'Kuruluşları siber tehditlerden koruyarak dijital dönüşümlerini güvenle tamamlamalarına yardımcı olmak.', en: 'Helping organizations complete their digital transformation securely by protecting them from cyber threats.' },
          },
          {
            icon: '🌍',
            title: { tr: 'Vizyonumuz', en: 'Our Vision' },
            description: { tr: 'Küresel ölçekte tanınan, yerli ve milli bir siber güvenlik şirketi olmak.', en: 'To become a globally recognized domestic cybersecurity company.' },
          },
          {
            icon: '💎',
            title: { tr: 'Değerlerimiz', en: 'Our Values' },
            description: { tr: 'Dürüstlük, yenilikçilik, müşteri odaklılık ve sürekli gelişim.', en: 'Integrity, innovation, customer focus, and continuous improvement.' },
          },
        ],
      },
    },
  });

  await prisma.pageComponent.upsert({
    where: { id: IDS.component.about_cta },
    update: {
      data: {
        __type: 'cta',
        heading: { tr: 'Bizimle Çalışmak İster misiniz?', en: 'Want to Work With Us?' },
        buttonLabel: { tr: 'İletişime Geçin', en: 'Contact Us' },
        buttonUrl: '/iletisim',
      },
    },
    create: {
      id: IDS.component.about_cta,
      pageId: IDS.page.about,
      type: ComponentType.cta,
      order: 3,
      isVisible: true,
      data: {
        __type: 'cta',
        heading: { tr: 'Bizimle Çalışmak İster misiniz?', en: 'Want to Work With Us?' },
        buttonLabel: { tr: 'İletişime Geçin', en: 'Contact Us' },
        buttonUrl: '/iletisim',
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
    update: { data: { __type: 'form_embed', formId: contactForm.id } },
    create: {
      id: IDS.component.contact_form,
      pageId: IDS.page.contact,
      type: ComponentType.form_embed,
      order: 2,
      isVisible: true,
      data: { __type: 'form_embed', formId: contactForm.id },
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
    update: { data: { __type: 'form_embed', formId: demoForm.id } },
    create: {
      id: IDS.component.demo_form,
      pageId: IDS.page.demo,
      type: ComponentType.form_embed,
      order: 2,
      isVisible: true,
      data: { __type: 'form_embed', formId: demoForm.id },
    },
  });

  // Resources page
  await prisma.pageComponent.upsert({
    where: { id: IDS.component.resources_hero },
    update: {
      data: {
        __type: 'hero',
        heading: { tr: 'Kaynaklar', en: 'Resources' },
        subheading: { tr: 'Teknik belgeler, vaka çalışmaları ve veri sayfaları ile bilgi edinin.', en: 'Gain knowledge with technical documents, case studies, and datasheets.' },
      },
    },
    create: {
      id: IDS.component.resources_hero,
      pageId: IDS.page.resources,
      type: ComponentType.hero,
      order: 1,
      isVisible: true,
      data: {
        __type: 'hero',
        heading: { tr: 'Kaynaklar', en: 'Resources' },
        subheading: { tr: 'Teknik belgeler, vaka çalışmaları ve veri sayfaları ile bilgi edinin.', en: 'Gain knowledge with technical documents, case studies, and datasheets.' },
      },
    },
  });

  await prisma.pageComponent.upsert({
    where: { id: IDS.component.resources_features },
    update: {
      data: {
        __type: 'features_grid',
        items: [
          { icon: '📄', title: { tr: 'Teknik Belgeler', en: 'Whitepapers' }, description: { tr: 'Siber güvenlik konularında derinlemesine teknik belgeler.', en: 'In-depth technical documents on cybersecurity topics.' } },
          { icon: '📊', title: { tr: 'Vaka Çalışmaları', en: 'Case Studies' }, description: { tr: 'Müşterilerimizin başarı hikâyelerini inceleyin.', en: 'Explore success stories from our customers.' } },
          { icon: '📋', title: { tr: 'Veri Sayfaları', en: 'Datasheets' }, description: { tr: 'Ürün ve çözümlerimize ait teknik özellikler.', en: 'Technical specifications for our products and solutions.' } },
        ],
      },
    },
    create: {
      id: IDS.component.resources_features,
      pageId: IDS.page.resources,
      type: ComponentType.features_grid,
      order: 2,
      isVisible: true,
      data: {
        __type: 'features_grid',
        items: [
          { icon: '📄', title: { tr: 'Teknik Belgeler', en: 'Whitepapers' }, description: { tr: 'Siber güvenlik konularında derinlemesine teknik belgeler.', en: 'In-depth technical documents on cybersecurity topics.' } },
          { icon: '📊', title: { tr: 'Vaka Çalışmaları', en: 'Case Studies' }, description: { tr: 'Müşterilerimizin başarı hikâyelerini inceleyin.', en: 'Explore success stories from our customers.' } },
          { icon: '📋', title: { tr: 'Veri Sayfaları', en: 'Datasheets' }, description: { tr: 'Ürün ve çözümlerimize ait teknik özellikler.', en: 'Technical specifications for our products and solutions.' } },
        ],
      },
    },
  });

  await prisma.pageComponent.upsert({
    where: { id: IDS.component.resources_cta },
    update: {
      data: {
        __type: 'cta',
        heading: { tr: 'Daha Fazla Bilgi Almak İster misiniz?', en: 'Want to Learn More?' },
        buttonLabel: { tr: 'Bize Ulaşın', en: 'Contact Us' },
        buttonUrl: '/iletisim',
      },
    },
    create: {
      id: IDS.component.resources_cta,
      pageId: IDS.page.resources,
      type: ComponentType.cta,
      order: 3,
      isVisible: true,
      data: {
        __type: 'cta',
        heading: { tr: 'Daha Fazla Bilgi Almak İster misiniz?', en: 'Want to Learn More?' },
        buttonLabel: { tr: 'Bize Ulaşın', en: 'Contact Us' },
        buttonUrl: '/iletisim',
      },
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

  await prisma.blogPost.upsert({
    where: { id: IDS.post.p1 }, update: {},
    create: { id: IDS.post.p1, slug: { tr: 'nestjs-ile-api-gelistirme', en: 'api-development-with-nestjs' }, status: ContentStatus.PUBLISHED, publishedAt: new Date('2026-01-10'), title: { tr: 'NestJS ile API Geliştirme', en: 'API Development with NestJS' }, excerpt: { tr: 'NestJS ile modern API nasıl inşa edilir.', en: 'How to build a modern API with NestJS.' }, body: { tr: '## NestJS\n\nNestJS güçlü bir Node.js framework\'üdür.', en: '## NestJS\n\nNestJS is a powerful Node.js framework.' }, readingTimeMinutes: 5, authorId: admin.id, categoryId: category.id, tags: { connect: [{ id: tag1.id }] }, seoMetaId: seoPosts[0]!.id, createdById: admin.id, updatedById: admin.id },
  });
  await prisma.blogPost.upsert({
    where: { id: IDS.post.p2 }, update: {},
    create: { id: IDS.post.p2, slug: { tr: 'prisma-ile-veritabani', en: 'database-with-prisma' }, status: ContentStatus.PUBLISHED, publishedAt: new Date('2026-01-20'), title: { tr: 'Prisma ile Veritabanı Yönetimi', en: 'Database Management with Prisma' }, excerpt: { tr: 'Prisma ORM ile tip-güvenli veritabanı işlemleri.', en: 'Type-safe database operations with Prisma ORM.' }, body: { tr: '## Prisma ORM\n\nPrisma modern bir ORM\'dir.', en: '## Prisma ORM\n\nPrisma is a modern ORM.' }, readingTimeMinutes: 7, authorId: admin.id, categoryId: category.id, tags: { connect: [{ id: tag2.id }] }, seoMetaId: seoPosts[1]!.id, createdById: admin.id, updatedById: admin.id },
  });
  await prisma.blogPost.upsert({
    where: { id: IDS.post.p3 }, update: {},
    create: { id: IDS.post.p3, slug: { tr: 'typescript-ipuclari', en: 'typescript-tips' }, status: ContentStatus.PUBLISHED, publishedAt: new Date('2026-02-01'), title: { tr: 'TypeScript İpuçları', en: 'TypeScript Tips' }, excerpt: { tr: 'Üretkenliğinizi artıracak TypeScript ipuçları.', en: 'TypeScript tips to boost your productivity.' }, body: { tr: '## TypeScript\n\nTip güvenliği önemlidir.', en: '## TypeScript\n\nType safety matters.' }, readingTimeMinutes: 4, authorId: admin.id, categoryId: category.id, tags: { connect: [{ id: tag1.id }, { id: tag2.id }] }, seoMetaId: seoPosts[2]!.id, createdById: admin.id, updatedById: admin.id },
  });
  await prisma.blogPost.upsert({
    where: { id: IDS.post.p4 }, update: {},
    create: { id: IDS.post.p4, slug: { tr: 'docker-ile-deployment', en: 'deployment-with-docker' }, status: ContentStatus.DRAFT, title: { tr: 'Docker ile Deployment', en: 'Deployment with Docker' }, excerpt: { tr: 'Docker ile production deployment rehberi.', en: 'Production deployment guide with Docker.' }, body: { tr: '## Docker\n\nDocker konteynerleri izole eder.', en: '## Docker\n\nDocker isolates containers.' }, readingTimeMinutes: 6, authorId: admin.id, categoryId: category.id, seoMetaId: seoPosts[3]!.id, createdById: admin.id, updatedById: admin.id },
  });
  await prisma.blogPost.upsert({
    where: { id: IDS.post.p5 }, update: {},
    create: { id: IDS.post.p5, slug: { tr: 'jwt-guvenligi', en: 'jwt-security' }, status: ContentStatus.DRAFT, title: { tr: 'JWT Güvenliği', en: 'JWT Security' }, excerpt: { tr: 'JWT token güvenliği için en iyi pratikler.', en: 'Best practices for JWT token security.' }, body: { tr: '## JWT\n\nToken güvenliği kritiktir.', en: '## JWT\n\nToken security is critical.' }, readingTimeMinutes: 8, authorId: admin.id, seoMetaId: seoPosts[4]!.id, createdById: admin.id, updatedById: admin.id },
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
  // Redirect old 'about' slug to 'about-us'
  await prisma.redirect.upsert({
    where: { source: '/en/about' },
    update: {},
    create: { source: '/en/about', destination: '/en/about-us', statusCode: 301, isActive: true },
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
    { id: IDS.nav.tr_about,     label: 'Hakkımızda',  href: '/tr/hakkimizda',  order: 4 },
    { id: IDS.nav.tr_contact,   label: 'İletişim',    href: '/tr/iletisim',    order: 5 },
    { id: IDS.nav.tr_demo,      label: 'Demo Talebi', href: '/tr/demo',        order: 6 },
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
    { id: IDS.nav.en_about,     label: 'About Us',     href: '/en/about-us',  order: 4 },
    { id: IDS.nav.en_contact,   label: 'Contact',      href: '/en/contact',   order: 5 },
    { id: IDS.nav.en_demo,      label: 'Request Demo', href: '/en/demo',      order: 6 },
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
