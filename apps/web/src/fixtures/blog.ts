import type { BlogPost } from './types';

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    slug: { tr: 'pam-nedir', en: 'what-is-pam' },
    title: {
      tr: 'PAM Nedir? Ayrıcalıklı Erişim Yönetiminin Önemi',
      en: 'What is PAM? The Importance of Privileged Access Management',
    },
    excerpt: {
      tr: 'Privileged Access Management (PAM), kuruluşların kritik sistemlerine yetkisiz erişimi engellemek için kullandığı siber güvenlik stratejisidir.',
      en: 'Privileged Access Management (PAM) is a cybersecurity strategy used by organizations to prevent unauthorized access to critical systems.',
    },
    category: 'blog',
    image: '/assets/uploads/products/pam.jpg',
    publishedAt: '2024-03-15',
  },
  {
    id: 2,
    slug: { tr: 'kvkk-uyumlulugu', en: 'gdpr-compliance' },
    title: {
      tr: 'KVKK Uyumluluğu İçin Veri Güvenliği Çözümleri',
      en: 'Data Security Solutions for GDPR Compliance',
    },
    excerpt: {
      tr: 'KVKK ve GDPR gerekliliklerini karşılamak için veri maskeleme ve erişim kontrolü çözümleri nasıl uygulanır?',
      en: 'How to implement data masking and access control solutions to meet KVKK and GDPR requirements.',
    },
    category: 'blog',
    image: '/assets/uploads/products/ddm.png',
    publishedAt: '2024-03-10',
  },
  {
    id: 3,
    slug: { tr: 'kron-kuppingercole-odulu', en: 'kron-kuppingercole-award' },
    title: {
      tr: 'Krontech, KuppingerCole Leadership Compass\'ta Overall Leader Seçildi',
      en: 'Krontech Selected as Overall Leader in KuppingerCole Leadership Compass',
    },
    excerpt: {
      tr: 'Krontech, KuppingerCole tarafından hazırlanan Privileged Access Management raporu ile Overall Leader ödülüne layık görüldü.',
      en: 'Krontech has been awarded the Overall Leader distinction in the Privileged Access Management report prepared by KuppingerCole.',
    },
    category: 'haber',
    image: '/assets/uploads/content/homepage_kuppingercole.png',
    publishedAt: '2024-02-28',
  },
  {
    id: 4,
    slug: { tr: 'veritabani-guvenligi', en: 'database-security' },
    title: {
      tr: 'Veritabanı Güvenliği: Tehditler ve Savunma Yöntemleri',
      en: 'Database Security: Threats and Defense Methods',
    },
    excerpt: {
      tr: 'Modern veritabanı tehditlerine karşı nasıl korunulur? DAM ve QA çözümleri nasıl çalışır?',
      en: 'How to protect against modern database threats? How do DAM and QA solutions work?',
    },
    category: 'blog',
    image: '/assets/uploads/products/dam.png',
    publishedAt: '2024-02-20',
  },
  {
    id: 5,
    slug: { tr: 'anadolu-efes-vaka-calismasi', en: 'anadolu-efes-case-study' },
    title: {
      tr: 'Anadolu Efes ile Siber Güvenlik Başarı Hikayesi',
      en: 'Cybersecurity Success Story with Anadolu Efes',
    },
    excerpt: {
      tr: 'Anadolu Efes, Krontech PAM çözümü ile kritik sistemlerine erişim güvenliğini nasıl sağladı?',
      en: 'How did Anadolu Efes ensure access security for its critical systems with Krontech PAM solution?',
    },
    category: 'haber',
    image: '/assets/uploads/content/kron-anadolu-efes.jpg',
    publishedAt: '2024-02-05',
  },
  {
    id: 6,
    slug: { tr: 'sifir-guven-mimarisi', en: 'zero-trust-architecture' },
    title: {
      tr: 'Sıfır Güven Mimarisi ve PAM Entegrasyonu',
      en: 'Zero Trust Architecture and PAM Integration',
    },
    excerpt: {
      tr: 'Sıfır güven güvenlik modelini kuruluşunuzda nasıl uygularsınız ve PAM bu yaklaşımı nasıl destekler?',
      en: 'How do you implement the zero trust security model in your organization and how does PAM support this approach?',
    },
    category: 'blog',
    image: '/assets/uploads/products/aaa.png',
    publishedAt: '2024-01-25',
  },
];
