import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { roboto } from '@/app/fonts';

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

  const messages = await getMessages();

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
          <Header locale={locale} />
          <main>{children}</main>
          <Footer locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
