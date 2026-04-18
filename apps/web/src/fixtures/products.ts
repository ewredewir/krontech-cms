import type { ProductCard } from './types';

export const products: ProductCard[] = [
  {
    id: 1,
    slug: 'pam',
    name: { tr: 'Privileged Access Management', en: 'Privileged Access Management' },
    description: {
      tr: 'Ayrıcalıklı hesaplara erişimi merkezi olarak yönetin, denetleyin ve güvence altına alın.',
      en: 'Centrally manage, monitor, and secure access to privileged accounts.',
    },
    bullets: [
      { tr: 'Merkezi hesap yönetimi', en: 'Centralized account management' },
      { tr: 'Oturum kaydı ve izleme', en: 'Session recording and monitoring' },
      { tr: 'Çift faktörlü kimlik doğrulama', en: 'Two-factor authentication' },
      { tr: 'Parola kasası', en: 'Password vault' },
    ],
    image: '/assets/uploads/products/pam.jpg',
    href: '/products/pam',
    faqs: [
      {
        question: { tr: 'PAM nedir?', en: 'What is PAM?' },
        answer: {
          tr: 'PAM (Privileged Access Management), kuruluşların ayrıcalıklı hesaplara ve erişim haklarına yönelik tehditleri korumasına yardımcı olan bir siber güvenlik stratejisidir.',
          en: 'PAM (Privileged Access Management) is a cybersecurity strategy that helps organizations protect against threats targeting privileged accounts and access rights.',
        },
      },
      {
        question: { tr: 'PAM neden önemlidir?', en: 'Why is PAM important?' },
        answer: {
          tr: 'Siber saldırıların büyük çoğunluğu ayrıcalıklı hesapları hedef alır. PAM, bu riskleri minimize eder.',
          en: 'The majority of cyberattacks target privileged accounts. PAM minimizes these risks.',
        },
      },
      {
        question: { tr: 'Hangi platformlarla entegre olur?', en: 'Which platforms does it integrate with?' },
        answer: {
          tr: 'Windows, Linux, Unix, veritabanları ve bulut platformlarıyla tam entegrasyon sağlar.',
          en: 'It provides full integration with Windows, Linux, Unix, databases, and cloud platforms.',
        },
      },
    ],
  },
  {
    id: 2,
    slug: 'dam',
    name: { tr: 'Database Activity Monitoring', en: 'Database Activity Monitoring' },
    description: {
      tr: 'Veritabanı aktivitelerini gerçek zamanlı olarak izleyin, anormalileri tespit edin.',
      en: 'Monitor database activities in real time and detect anomalies.',
    },
    bullets: [
      { tr: 'Gerçek zamanlı izleme', en: 'Real-time monitoring' },
      { tr: 'Anormallik tespiti', en: 'Anomaly detection' },
      { tr: 'Kapsamlı raporlama', en: 'Comprehensive reporting' },
      { tr: 'Uyumluluk desteği', en: 'Compliance support' },
    ],
    image: '/assets/uploads/products/dam.png',
    href: '/products/dam',
    faqs: [
      {
        question: { tr: 'DAM ne işe yarar?', en: 'What does DAM do?' },
        answer: {
          tr: 'DAM, veritabanlarına yapılan tüm erişimleri izleyerek yetkisiz işlemleri tespit eder.',
          en: 'DAM monitors all accesses to databases and detects unauthorized operations.',
        },
      },
      {
        question: { tr: 'Hangi veritabanlarını destekler?', en: 'Which databases does it support?' },
        answer: {
          tr: 'Oracle, MSSQL, MySQL, PostgreSQL ve diğer büyük veritabanlarını destekler.',
          en: 'It supports Oracle, MSSQL, MySQL, PostgreSQL, and other major databases.',
        },
      },
      {
        question: { tr: 'Performansı etkiler mi?', en: 'Does it affect performance?' },
        answer: {
          tr: 'Minimum etki ile çalışır; ajantsız mimari seçeneği mevcuttur.',
          en: 'It operates with minimal impact; an agentless architecture option is available.',
        },
      },
    ],
  },
  {
    id: 3,
    slug: 'ddm',
    name: { tr: 'Dynamic Data Masking', en: 'Dynamic Data Masking' },
    description: {
      tr: 'Hassas verileri yetkisiz kullanıcılardan gizleyin, GDPR ve KVKK uyumluluğunu sağlayın.',
      en: 'Hide sensitive data from unauthorized users, ensure GDPR and compliance.',
    },
    bullets: [
      { tr: 'Gerçek zamanlı maskeleme', en: 'Real-time masking' },
      { tr: 'KVKK uyumluluğu', en: 'KVKK compliance' },
      { tr: 'Rol tabanlı erişim', en: 'Role-based access' },
      { tr: 'Uygulama şeffaflığı', en: 'Application transparency' },
    ],
    image: '/assets/uploads/products/ddm.png',
    href: '/products/ddm',
    faqs: [
      {
        question: { tr: 'DDM nasıl çalışır?', en: 'How does DDM work?' },
        answer: {
          tr: 'DDM, veritabanı sorgularını gerçek zamanlı olarak değiştirerek hassas verileri maskeler.',
          en: 'DDM modifies database queries in real time to mask sensitive data.',
        },
      },
      {
        question: { tr: 'Uygulamaları değiştirmek gerekir mi?', en: 'Do applications need to be changed?' },
        answer: {
          tr: 'Hayır, DDM uygulama şeffaflığı ile çalışır; herhangi bir değişiklik gerekmez.',
          en: 'No, DDM works with application transparency; no changes are required.',
        },
      },
      {
        question: { tr: 'Hangi veri türlerini maskeler?', en: 'What data types does it mask?' },
        answer: {
          tr: 'TC kimlik, kredi kartı, e-posta, telefon ve özel nitelikli veriler dahil tüm veri türlerini destekler.',
          en: 'It supports all data types including national ID, credit card, email, phone, and special category data.',
        },
      },
    ],
  },
  {
    id: 4,
    slug: 'qa',
    name: { tr: 'Query Analysis', en: 'Query Analysis' },
    description: {
      tr: 'SQL enjeksiyon saldırılarını tespit edin, veritabanı sorgularını analiz edin.',
      en: 'Detect SQL injection attacks and analyze database queries.',
    },
    bullets: [
      { tr: 'SQL enjeksiyon tespiti', en: 'SQL injection detection' },
      { tr: 'Sorgu davranış analizi', en: 'Query behavior analysis' },
      { tr: 'Otomatik engelleme', en: 'Automatic blocking' },
      { tr: 'Detaylı loglama', en: 'Detailed logging' },
    ],
    image: '/assets/uploads/products/qa.png',
    href: '/products/qa',
    faqs: [
      {
        question: { tr: 'QA ne tür saldırıları engeller?', en: 'What types of attacks does QA block?' },
        answer: {
          tr: 'SQL enjeksiyon, yetkisiz veri erişimi ve anormal sorgu paternlerini engeller.',
          en: 'It blocks SQL injection, unauthorized data access, and abnormal query patterns.',
        },
      },
      {
        question: { tr: 'Gerçek zamanlı engelleme yapıyor mu?', en: 'Does it block in real time?' },
        answer: {
          tr: 'Evet, şüpheli sorgular milisaniyeler içinde tespit edilip engellenir.',
          en: 'Yes, suspicious queries are detected and blocked within milliseconds.',
        },
      },
      {
        question: { tr: 'Mevcut sistemlerle entegre olur mu?', en: 'Does it integrate with existing systems?' },
        answer: {
          tr: 'Tüm büyük veritabanı yönetim sistemleriyle sorunsuz entegrasyon sağlar.',
          en: 'It integrates seamlessly with all major database management systems.',
        },
      },
    ],
  },
  {
    id: 5,
    slug: 'aaa',
    name: { tr: 'AAA', en: 'AAA' },
    description: {
      tr: 'Authentication, Authorization ve Accounting ile kimlik yönetimini merkezi hale getirin.',
      en: 'Centralize identity management with Authentication, Authorization, and Accounting.',
    },
    bullets: [
      { tr: 'Merkezi kimlik yönetimi', en: 'Centralized identity management' },
      { tr: 'Çok faktörlü doğrulama', en: 'Multi-factor authentication' },
      { tr: 'LDAP/AD entegrasyonu', en: 'LDAP/AD integration' },
      { tr: 'Kapsamlı denetim izi', en: 'Comprehensive audit trail' },
    ],
    image: '/assets/uploads/products/aaa.png',
    href: '/products/aaa',
    faqs: [
      {
        question: { tr: 'AAA çözümü ne sağlar?', en: 'What does the AAA solution provide?' },
        answer: {
          tr: 'Kimlik doğrulama (Authentication), yetkilendirme (Authorization) ve hesap tutma (Accounting) hizmetlerini merkezi olarak sağlar.',
          en: 'It centrally provides authentication, authorization, and accounting services.',
        },
      },
      {
        question: { tr: 'Active Directory ile çalışır mı?', en: 'Does it work with Active Directory?' },
        answer: {
          tr: 'Evet, LDAP ve Active Directory ile tam entegrasyon sağlar.',
          en: 'Yes, it provides full integration with LDAP and Active Directory.',
        },
      },
      {
        question: { tr: 'Bulut ortamlarını destekler mi?', en: 'Does it support cloud environments?' },
        answer: {
          tr: 'Hibrit ve tam bulut ortamlarıyla uyumlu çalışır.',
          en: 'It works compatibly with hybrid and fully cloud environments.',
        },
      },
    ],
  },
  {
    id: 6,
    slug: 'tlmp',
    name: { tr: 'TLMP', en: 'TLMP' },
    description: {
      tr: 'Teknoloji lisans yönetimini otomatikleştirin, maliyetlerinizi optimize edin.',
      en: 'Automate technology license management and optimize your costs.',
    },
    bullets: [
      { tr: 'Otomatik lisans takibi', en: 'Automated license tracking' },
      { tr: 'Maliyet optimizasyonu', en: 'Cost optimization' },
      { tr: 'Uyumluluk raporlaması', en: 'Compliance reporting' },
      { tr: 'Yazılım kullanım analizi', en: 'Software usage analysis' },
    ],
    image: '/assets/uploads/products/tlmp.png',
    href: '/products/tlmp',
    faqs: [
      {
        question: { tr: 'TLMP hangi sorunu çözer?', en: 'What problem does TLMP solve?' },
        answer: {
          tr: 'Kurumsal yazılım lisanslarının takibini, yönetimini ve maliyet optimizasyonunu otomatikleştirir.',
          en: 'It automates tracking, management, and cost optimization of enterprise software licenses.',
        },
      },
      {
        question: { tr: 'Hangi üreticilerin lisanslarını yönetir?', en: 'Which vendor licenses does it manage?' },
        answer: {
          tr: 'Microsoft, Oracle, SAP ve 500+ yazılım üreticisinin lisanslarını yönetir.',
          en: 'It manages licenses from Microsoft, Oracle, SAP, and 500+ software vendors.',
        },
      },
      {
        question: { tr: 'Lisans uyumsuzluklarını önceden bildirir mi?', en: 'Does it warn about license non-compliance in advance?' },
        answer: {
          tr: 'Evet, lisans süresi dolmadan ve uyumsuzluk oluşmadan proaktif bildirimler gönderir.',
          en: 'Yes, it sends proactive notifications before license expiration and non-compliance.',
        },
      },
    ],
  },
];
