import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { PreviewBanner } from '@/components/layout/PreviewBanner';
import { roboto } from '@/app/fonts';
import { apiFetch } from '@/lib/api';
import type { NavItem } from '@/types';

interface NavTreeItem {
  id: string;
  label: string;
  href: string | null;
  order: number;
  children: NavTreeItem[];
}

function toNavItems(tree: NavTreeItem[]): NavItem[] {
  return tree.map((item) => ({
    label: item.label,
    ...(item.href ? { href: item.href } : {}),
    ...(item.children.length > 0
      ? {
          children: item.children
            .filter((c) => c.href)
            .map((c) => ({ label: c.label, href: c.href as string })),
        }
      : {}),
  }));
}

interface SlugPair { slug: { tr: string; en: string } }
type SlugMap = { tr: Record<string, string>; en: Record<string, string> };

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = params.locale as Locale;
  const t = await getTranslations({ locale, namespace: 'common' });

  return {
    title: {
      default: 'Krontech',
      template: '%s | Krontech',
    },
    description:
      locale === 'tr'
        ? 'Krontech — Siber Güvenlik Çözümleri'
        : 'Krontech — Cybersecurity Solutions',
    alternates: {
      languages: {
        tr: 'https://krontech.com/tr',
        en: 'https://krontech.com/en',
        'x-default': 'https://krontech.com/tr',
      },
    },
    other: { _t: t('home') },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const locale = params.locale as Locale;
  if (!locales.includes(locale)) notFound();

  setRequestLocale(locale);

  const [messages, navTree, slugPairs] = await Promise.all([
    getMessages(),
    apiFetch<NavTreeItem[]>(`/v1/public/navigation/${locale}`, {
      next: { revalidate: 60, tags: [`nav-${locale}`] },
    }),
    apiFetch<SlugPair[]>('/v1/public/pages/all-slugs', {
      next: { revalidate: 3600 },
    }),
  ]);

  const navItems = navTree ? toNavItems(navTree) : undefined;

  const slugMap: SlugMap = { tr: {}, en: {} };
  for (const pair of slugPairs ?? []) {
    const { tr, en } = pair.slug;
    if (tr && en && tr !== en) {
      slugMap.tr[tr] = en;
      slugMap.en[en] = tr;
    }
  }

  return (
    <html lang={locale} className={roboto.className}>
      <head>
        <link rel="alternate" hrefLang="tr" href="https://krontech.com/tr" />
        <link rel="alternate" hrefLang="en" href="https://krontech.com/en" />
        <link rel="alternate" hrefLang="x-default" href="https://krontech.com/tr" />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {locale === 'en' && <AnnouncementBar />}
          <Header locale={locale} navItems={navItems} slugMap={slugMap} />
          <main>{children}</main>
          <Footer locale={locale} />
          <PreviewBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
