'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function AnnouncementBar() {
  const t = useTranslations('announcement');

  return (
    <div
      role="banner"
      aria-label="Announcement"
      className="w-full bg-primary text-white flex items-center justify-center text-sm font-medium"
      style={{ height: '56px' }}
    >
      <span>{t('text')}</span>
      <Link
        href="/en/resources"
        className="ml-3 underline hover:no-underline font-semibold"
      >
        {t('cta')}
      </Link>
    </div>
  );
}
