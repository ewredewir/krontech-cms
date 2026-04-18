'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { NavItem } from '@/fixtures/types';
import type { Locale } from '@/lib/i18n';

interface MobileNavProps {
  items: NavItem[];
  locale: Locale;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ items, locale, isOpen, onClose }: MobileNavProps) {
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const focusables = navRef.current?.querySelectorAll<HTMLElement>(
      'a, button, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables?.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    first.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const logoSrc =
    locale === 'en'
      ? '/assets/images/kt-dark-logo-en.png'
      : '/assets/images/kt-dark-logo-tr.png';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        ref={navRef}
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label={locale === 'en' ? 'Navigation menu' : 'Navigasyon menüsü'}
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <Link href={`/${locale}`} onClick={onClose}>
            <Image
              src={logoSrc}
              alt="Krontech"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </Link>
          <button
            onClick={onClose}
            aria-label={locale === 'en' ? 'Close menu' : 'Menüyü kapat'}
            className="p-2 text-heading hover:text-primary"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        </div>
        <nav aria-label={locale === 'en' ? 'Mobile navigation' : 'Mobil navigasyon'}>
          <ul className="py-4">
            {items.map((item, i) => (
              <li key={i}>
                {item.href ? (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="block px-6 py-3 text-nav-sm text-heading hover:text-primary hover:bg-body transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <div className="px-6 py-3 text-nav-sm font-semibold text-heading">{item.label}</div>
                )}
                {item.children && (
                  <ul className="bg-body">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onClose}
                          className="block px-8 py-2 text-nav-sm text-secondary-text hover:text-primary transition-colors"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
