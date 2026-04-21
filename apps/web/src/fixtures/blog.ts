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
    body: {
      tr: 'Privileged Access Management (PAM), kuruluşların kritik sistemlerine yetkisiz erişimi engellemek için kullandığı siber güvenlik stratejisidir. Ayrıcalıklı hesapların yönetimi, izlenmesi ve denetlenmesi, modern siber güvenlik stratejilerinin temel bileşenlerinden biridir.',
      en: 'Privileged Access Management (PAM) is a cybersecurity strategy used by organizations to prevent unauthorized access to critical systems. Managing, monitoring, and auditing privileged accounts is a fundamental component of modern cybersecurity strategies.',
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
    body: {
      tr: 'KVKK ve GDPR gerekliliklerini karşılamak için veri maskeleme ve erişim kontrolü çözümleri kritik öneme sahiptir. Kurumlar, kişisel verilerin güvenliğini sağlamak amacıyla kapsamlı bir veri güvenliği stratejisi benimsemelidir.',
      en: 'Data masking and access control solutions are critical for meeting KVKK and GDPR requirements. Organizations must adopt a comprehensive data security strategy to ensure the protection of personal data.',
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
    body: {
      tr: 'Krontech, KuppingerCole tarafından hazırlanan Privileged Access Management raporu ile Overall Leader ödülüne layık görüldü. Bu başarı, Krontech\'in güvenlik alanındaki küresel liderliğini ve inovatif çözümlerini bir kez daha tescil etmektedir.',
      en: 'Krontech has been awarded the Overall Leader distinction in the Privileged Access Management report prepared by KuppingerCole. This achievement once again confirms Krontech\'s global leadership and innovative solutions in the security domain.',
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
    body: {
      tr: 'Modern veritabanı tehditlerine karşı etkili koruma sağlamak için DAM (Database Activity Monitoring) ve QA çözümleri kritik bir rol oynamaktadır. Bu çözümler, veritabanı aktivitelerini gerçek zamanlı olarak izler ve anormal davranışları tespit eder.',
      en: 'DAM (Database Activity Monitoring) and QA solutions play a critical role in providing effective protection against modern database threats. These solutions monitor database activities in real-time and detect anomalous behavior.',
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
    body: {
      tr: 'Anadolu Efes, Krontech PAM çözümü ile kritik sistemlerine erişim güvenliğini başarıyla sağladı. Bu iş birliği, kurumsal güvenlik altyapısının güçlendirilmesinde önemli bir referans noktası oluşturmaktadır.',
      en: 'Anadolu Efes successfully ensured access security for its critical systems with Krontech\'s PAM solution. This collaboration represents an important reference point for strengthening enterprise security infrastructure.',
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
    body: {
      tr: 'Sıfır güven (Zero Trust) mimarisi, hiçbir kullanıcı veya sistemin varsayılan olarak güvenilir olmadığı prensibine dayanır. PAM çözümleri, bu yaklaşımı destekleyerek ayrıcalıklı erişimlerin sürekli doğrulanmasını ve denetlenmesini sağlar.',
      en: 'Zero Trust architecture is based on the principle that no user or system is trusted by default. PAM solutions support this approach by ensuring continuous verification and auditing of privileged access.',
    },
    category: 'blog',
    image: '/assets/uploads/products/aaa.png',
    publishedAt: '2024-01-25',
  },
];
