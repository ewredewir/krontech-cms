'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { NavDropdown } from '@/components/nav/NavDropdown';
import { LanguageSwitcher } from '@/components/nav/LanguageSwitcher';
import { MobileNav } from '@/components/layout/MobileNav';
import { navItemsTr, navItemsEn } from '@/fixtures/navigation';
import type { Locale } from '@/lib/i18n';

interface HeaderProps {
  locale: Locale;
}

export function Header({ locale }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations('nav');

  const navItems = locale === 'en' ? navItemsEn : navItemsTr;

  const logoSrc =
    locale === 'en'
      ? '/assets/images/kt-dark-logo-en.png'
      : '/assets/images/kt-dark-logo-tr.png';

  const trPath = pathname.replace(`/${locale}`, '/tr');
  const enPath = pathname.replace(`/${locale}`, '/en');

  const handleClose = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      <header
        className="fixed top-0 left-0 w-full bg-white shadow-sm z-[9]"
        style={{ height: '100px' }}
      >
        <div
          className="nav:hidden flex items-center justify-between px-5"
          style={{ height: '70px' }}
        >
          <Link href={`/${locale}`} aria-label="Krontech Ana Sayfa">
            <Image
              src={logoSrc}
              alt="Krontech"
              width={130}
              height={44}
              priority
              className="h-8 w-auto"
            />
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={t('openMenu')}
            className="p-2 text-heading"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        <div className="hidden nav:flex items-center justify-between h-full px-10 max-w-[1400px] mx-auto">
          <Link href={`/${locale}`} aria-label="Krontech Ana Sayfa">
            <Image
              src={logoSrc}
              alt="Krontech"
              width={160}
              height={54}
              priority
              className="h-11 w-auto"
            />
          </Link>

          <nav aria-label={locale === 'en' ? 'Main navigation' : 'Ana navigasyon'}>
            <ul className="flex items-center gap-8">
              {navItems.map((item, i) => {
                const isActive = item.href
                  ? pathname === item.href
                  : item.children?.some((c) => pathname === c.href);

                return (
                  <li key={i} className="nav-item relative flex items-center h-full py-8">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={`text-nav text-heading hover:text-primary transition-colors relative ${
                          isActive ? 'nav-link-active text-primary' : ''
                        }`}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <button
                        className={`text-nav text-heading hover:text-primary transition-colors flex items-center gap-1 relative ${
                          isActive ? 'nav-link-active text-primary' : ''
                        }`}
                        aria-haspopup="true"
                      >
                        {item.label}
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" className="mt-0.5" aria-hidden="true">
                          <path d="M0 0l5 6 5-6z" />
                        </svg>
                      </button>
                    )}
                    {item.children && <NavDropdown items={item.children} />}
                  </li>
                );
              })}
            </ul>
          </nav>

          <LanguageSwitcher locale={locale} trPath={trPath} enPath={enPath} />
        </div>
      </header>

      <MobileNav
        items={navItems}
        locale={locale}
        isOpen={mobileOpen}
        onClose={handleClose}
      />
    </>
  );
}
