import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';

export const revalidate = false;
import { PageBanner } from '@/components/shared/PageBanner';
import { Breadcrumb } from '@/components/shared/Breadcrumb';

interface PageProps {
  params: { locale: string };
}

const content = {
  tr: {
    metaTitle: 'Kaynaklar | Krontech',
    metaDescription:
      "Krontech'in üst düzey telekom ve siber güvenlik teknolojileri hakkında daha fazla bilgi edinmek için case study'lerimizi, blog'larımızı ve datasheet'lerimizi inceleyin.",
    bannerTitle: 'KAYNAKLAR',
    breadcrumb: 'Kaynaklar',
    description:
      "Kron'un üst düzey telekom ve siber güvenlik teknolojileri hakkında daha fazla bilgi edinmek için case study'lerimizi, blog'larımızı ve datasheet'lerimizi inceleyin.",
    cards: [
      {
        title: "CASE STUDY'LER",
        description:
          "Kron'un Ayrıcalıklı Erişim Yönetimi case study'leri ile hassas verilerinize ve kritik sistemlerinize erişen ayrıcalıklı hesapları nasıl koruyacağınızı öğrenin.",
        buttonLabel: 'Detaylı Bilgi',
        href: null as string | null,
      },
      {
        title: "DATASHEET'LER",
        description:
          "Kron'un dünyanın önde gelen Ayrıcalıklı Erişim Yönetimi ürünü olan Single Connect ve modülleri hakkında daha fazla bilgi almak için şimdi datasheet'leri inceleyin.",
        buttonLabel: 'Detaylı Bilgi',
        href: null as string | null,
      },
      {
        title: 'BLOG',
        description:
          "Bilişim teknolojilerindeki gelişmeler, siber güvenlik alanındaki trendler, erişim ve veri güvenliği hakkında detaylar en güncel haliyle Kron Blog'da.",
        buttonLabel: 'Detaylı Bilgi',
        href: '/tr/blog' as string | null,
      },
    ],
  },
  en: {
    metaTitle: 'Resources | Krontech',
    metaDescription:
      "Learn more about Kron's advanced telecom and cybersecurity technologies by exploring our case studies, blogs, and datasheets.",
    bannerTitle: 'RESOURCES',
    breadcrumb: 'Resources',
    description:
      "Learn more about Kron's advanced telecom and cybersecurity technologies by exploring our case studies, blogs, and datasheets.",
    cards: [
      {
        title: 'CASE STUDIES',
        description:
          "Learn how to protect privileged accounts accessing your sensitive data and critical systems with Kron's Privileged Access Management case studies.",
        buttonLabel: 'Learn More',
        href: null as string | null,
      },
      {
        title: 'DATASHEETS',
        description:
          "Explore the datasheets of Single Connect, Kron's world-leading Privileged Access Management product, and its modules to learn more.",
        buttonLabel: 'Learn More',
        href: null as string | null,
      },
      {
        title: 'BLOG',
        description:
          'Find the latest developments in IT technologies, cybersecurity trends, and details on access and data security on the Kron Blog.',
        buttonLabel: 'Learn More',
        href: '/en/blog' as string | null,
      },
    ],
  },
} as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as Locale;
  const c = content[locale] ?? content.en;

  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: {
      canonical: `https://krontech.com/${locale}/resources`,
      languages: {
        tr: 'https://krontech.com/tr/resources',
        en: 'https://krontech.com/en/resources',
      },
    },
    openGraph: {
      title: c.metaTitle,
      description: c.metaDescription,
      url: `https://krontech.com/${locale}/resources`,
      siteName: 'Krontech',
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
      type: 'website',
    },
  };
}

export default function ResourcesPage({ params }: PageProps) {
  const locale = params.locale as Locale;
  setRequestLocale(locale);
  const c = content[locale] ?? content.en;

  return (
    <>
      <PageBanner title={c.bannerTitle} />
      <Breadcrumb locale={locale} items={[{ label: c.breadcrumb }]} />

      <div className="max-w-[1400px] mx-auto px-6 nav:px-10 py-12">
        <p className="text-center text-secondary-text max-w-2xl mx-auto mb-12">
          {c.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {c.cards.map((card) => (
            <div key={card.title} className="flex flex-col border border-gray-200 bg-white">
              <div className="h-48 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600" />
              <div className="flex flex-col flex-1 p-6 gap-4">
                <h2 className="text-primary font-bold text-sm tracking-wide">{card.title}</h2>
                <p className="text-secondary-text text-sm leading-relaxed flex-1">
                  {card.description}
                </p>
                {card.href ? (
                  <Link
                    href={card.href}
                    className="self-start border border-primary text-primary text-sm px-5 py-2 hover:bg-primary hover:text-white transition-colors"
                  >
                    {card.buttonLabel}
                  </Link>
                ) : (
                  <span className="self-start border border-gray-300 text-gray-400 text-sm px-5 py-2 cursor-default">
                    {card.buttonLabel}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
