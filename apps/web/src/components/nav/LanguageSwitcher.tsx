'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n';

interface LanguageSwitcherProps {
  locale: Locale;
  trPath: string;
  enPath: string;
  isDark?: boolean;
}

export function LanguageSwitcher({ locale, trPath, enPath, isDark }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Switch language"
        className={`flex items-center gap-1 px-3 py-1 text-nav-sm font-medium transition-colors ${
          isDark
            ? 'bg-black text-white'
            : 'text-heading hover:text-primary'
        }`}
      >
        <span className={open && isDark ? 'opacity-100' : isDark ? 'opacity-60' : ''}>
          {locale.toUpperCase()}
        </span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" aria-hidden="true">
          <path d="M0 0l5 6 5-6z" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select language"
          className={`absolute right-0 top-full mt-1 w-16 z-50 shadow-card ${
            isDark ? 'bg-black' : 'bg-white'
          }`}
        >
          <li role="option" aria-selected={locale === 'tr'}>
            <Link
              href={trPath}
              locale={false}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 text-nav-sm hover:text-primary transition-colors ${
                isDark
                  ? locale === 'tr'
                    ? 'text-white'
                    : 'text-white/60'
                  : locale === 'tr'
                  ? 'text-primary font-semibold'
                  : 'text-heading'
              }`}
            >
              TR
            </Link>
          </li>
          <li role="option" aria-selected={locale === 'en'}>
            <Link
              href={enPath}
              locale={false}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 text-nav-sm hover:text-primary transition-colors ${
                isDark
                  ? locale === 'en'
                    ? 'text-white'
                    : 'text-white/60'
                  : locale === 'en'
                  ? 'text-primary font-semibold'
                  : 'text-heading'
              }`}
            >
              EN
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
