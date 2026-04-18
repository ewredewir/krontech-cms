import Link from 'next/link';
import type { NavDropdownItem } from '@/fixtures/types';

interface NavDropdownProps {
  items: NavDropdownItem[];
}

export function NavDropdown({ items }: NavDropdownProps) {
  return (
    <div
      className="nav-dropdown absolute left-0 top-full bg-white shadow-card min-w-[240px] z-50"
      style={{ borderTop: '3px solid rgba(21,99,255,0.1)', padding: '24px 30px' }}
      role="menu"
    >
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.href} role="none">
            <Link
              href={item.href}
              role="menuitem"
              className="text-nav-sm text-heading hover:text-primary transition-colors block py-1"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
