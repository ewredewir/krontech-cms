import Link from 'next/link';
import type { Locale } from '@/lib/i18n';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  locale: Locale;
}

export function Breadcrumb({ items, locale }: BreadcrumbProps) {
  const homeLabel = locale === 'en' ? 'Home' : 'Ana Sayfa';

  const allItems = [{ label: homeLabel, href: `/${locale}` }, ...items];

  return (
    <nav aria-label="Breadcrumb" className="py-3 bg-white border-b border-gray-100">
      <div className="max-w-[1400px] mx-auto px-6 nav:px-10">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-secondary-text">
          {allItems.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && (
                <span aria-hidden="true" className="text-gray-300">
                  /
                </span>
              )}
              {item.href && i < allItems.length - 1 ? (
                <Link
                  href={item.href}
                  className="hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={i === allItems.length - 1 ? 'page' : undefined} className="text-heading">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
