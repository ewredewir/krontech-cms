'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n';

interface FooterProps {
  locale: Locale;
}

export function Footer({ locale }: FooterProps) {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  return (
    <footer aria-label={t('sectionLabel')} className="bg-footer text-white">
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 nav:grid-cols-4 gap-10">
          <div>
            <Link href={`/${locale}`} aria-label="Krontech">
              <Image
                src="/assets/images/kt-light-logo-tr.png"
                alt="Krontech"
                width={150}
                height={50}
                className="h-10 w-auto mb-4"
              />
            </Link>
            <address className="not-italic text-sm text-gray-400 leading-7">
              <p className="font-semibold text-white text-sm mb-1">{t('address')}</p>
              <p>Maslak Mah. Büyükdere Cad.</p>
              <p>No:237 Noramin İş Merkezi</p>
              <p>34485 Sarıyer / İstanbul</p>
              <p className="mt-3">
                <span className="font-semibold text-white">{t('phone')}: </span>
                <a href="tel:+902122904400" className="hover:text-primary transition-colors">
                  +90 212 290 44 00
                </a>
              </p>
              <p>
                <span className="font-semibold text-white">{t('email')}: </span>
                <a href="mailto:info@krontech.com" className="hover:text-primary transition-colors">
                  info@krontech.com
                </a>
              </p>
            </address>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">{locale === 'en' ? 'Products' : 'Ürünler'}</h3>
            <ul className="space-y-2">
              {['pam', 'dam', 'ddm', 'qa', 'aaa', 'tlmp'].map((slug) => (
                <li key={slug}>
                  <Link
                    href={`/${locale}/products/${slug}`}
                    className="text-sm text-gray-400 hover:text-primary transition-colors uppercase"
                  >
                    {slug}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">{locale === 'en' ? 'Company' : 'Kurumsal'}</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/${locale === 'tr' ? 'hakkimizda' : 'about-us'}`} className="text-sm text-gray-400 hover:text-primary transition-colors">
                  {locale === 'en' ? 'About Us' : 'Hakkımızda'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/blog`} className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/resources`} className="text-sm text-gray-400 hover:text-primary transition-colors">
                  {locale === 'en' ? 'Resources' : 'Kaynaklar'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/${locale === 'tr' ? 'iletisim' : 'contact'}`} className="text-sm text-gray-400 hover:text-primary transition-colors">
                  {locale === 'en' ? 'Contact' : 'İletişim'}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">{t('newsletter')}</h3>
            <NewsletterForm locale={locale} />
            <div className="mt-6 flex gap-3">
              <a
                href="https://x.com/kron_tech"
                aria-label="Twitter / X"
                className="text-gray-400 hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/krontech/"
                aria-label="LinkedIn"
                className="text-gray-400 hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-sub-footer py-4">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col nav:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>{t('copyright', { year })}</p>
          <div className="flex gap-4">
            <Link href={`/${locale}/${locale === 'tr' ? 'gizlilik' : 'privacy'}`} className="hover:text-primary transition-colors">
              {t('privacy')}
            </Link>
            <Link href={`/${locale}/kvkk`} className="hover:text-primary transition-colors">
              {t('kvkk')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function NewsletterForm({ locale }: { locale: Locale }) {
  const t = useTranslations('footer');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return <p className="text-sm text-success">{locale === 'en' ? 'Thank you for subscribing!' : 'Abone olduğunuz için teşekkürler!'}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="newsletter-email" className="sr-only">{t('newsletterPlaceholder')}</label>
      <input
        id="newsletter-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('newsletterPlaceholder')}
        required
        className="dark-form h-[46px] bg-transparent border border-white/40 text-white placeholder:text-white/60 px-4 text-sm outline-none focus:border-primary w-full"
      />
      <button
        type="submit"
        className="bg-primary text-white text-sm font-medium py-2 px-6 hover:bg-primary-light transition-colors"
      >
        {t('newsletterSubmit')}
      </button>
    </form>
  );
}
