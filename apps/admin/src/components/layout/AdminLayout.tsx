'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/pages', label: 'Pages', icon: '⊞' },
  { href: '/blog/posts', label: 'Blog Posts', icon: '✎' },
  { href: '/blog/categories', label: 'Categories', icon: '◈' },
  { href: '/blog/tags', label: 'Tags', icon: '⊛' },
  { href: '/products', label: 'Products', icon: '⬡' },
  { href: '/media', label: 'Media', icon: '⊡' },
  { href: '/forms', label: 'Forms', icon: '≡' },
  { href: '/navigation', label: 'Navigation', icon: '☰' },
  { href: '/redirects', label: 'Redirects', icon: '↗' },
{ href: '/audit-log', label: 'Audit Log', icon: '☰', adminOnly: true },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  breadcrumb?: string;
}

export function AdminLayout({ children, breadcrumb }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && user?.role !== 'ADMIN') return false;
    return true;
  });

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-sidebar text-white flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-white/10">
          <span className="text-sm font-semibold tracking-wide text-white">KRONTECH CMS</span>
        </div>
        <nav aria-label="Main navigation" className="flex-1 py-2 overflow-y-auto">
          {visibleItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-primary text-white'
                    : 'text-white/70 hover:bg-sidebar-hover hover:text-white'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-white/10 text-xs text-white/50">
          <p className="truncate">{user?.email}</p>
          <p className="mt-0.5 text-white/30 uppercase tracking-wider">{user?.role}</p>
          <button
            onClick={() => { void handleLogout(); }}
            className="mt-3 text-white/50 hover:text-white text-xs"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center">
          {breadcrumb && (
            <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
              <span>{breadcrumb}</span>
            </nav>
          )}
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
