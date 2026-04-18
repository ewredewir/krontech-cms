import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/tr',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  notFound: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const translations: Record<string, Record<string, string>> = {
      nav: {
        openMenu: 'Menüyü aç',
        closeMenu: 'Menüyü kapat',
        products: 'Ürünler',
      },
      blog: {
        blogBadge: 'Blog',
        haberBadge: 'Haber',
        readMore: 'Devamını Oku',
        sectionLabel: 'Blog bölümü',
        sectionTitle: 'Blog & Haberler',
        featuredTitle: 'Öne Çıkanlar',
        allPosts: 'Tüm Yazılar',
      },
      contact: {
        sectionLabel: 'İletişim formu',
        sectionTitle: 'Bizimle İletişime Geçin',
        sectionSubtitle: 'Form doldurun.',
        firstName: 'İsim',
        lastName: 'Soyisim',
        email: 'E-posta',
        title: 'Ünvan',
        department: 'Departman',
        company: 'Şirket',
        phone: 'Telefon',
        callbackPreference: 'Geri Arama',
        message: 'Mesaj',
        kvkk1: 'KVKK onaylıyorum.',
        kvkk2: 'Ticari ileti.',
        submit: 'Gönder',
        submitting: 'Gönderiliyor...',
        successMessage: 'Başarılı!',
        errorMessage: 'Hata oluştu.',
        required: 'Bu alan zorunludur.',
        invalidEmail: 'Geçerli e-posta giriniz.',
        selectDepartment: 'Departman seçiniz',
        deptIT: 'BT',
        deptSecurity: 'Güvenlik',
        deptManagement: 'Yönetim',
        deptOther: 'Diğer',
      },
      announcement: {
        text: 'Test announcement',
        cta: 'More',
      },
    };

    return (key: string) => translations[namespace]?.[key] ?? key;
  },
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));
