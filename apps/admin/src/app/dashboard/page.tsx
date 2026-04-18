'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import api from '@/lib/api';

interface Stats {
  pages: number;
  blogPosts: number;
  products: number;
  mediaFiles: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [pages, posts, products, media] = await Promise.all([
          api.get<{ total: number }>('/pages'),
          api.get<{ total: number }>('/blog/posts'),
          api.get<{ total: number }>('/products'),
          api.get<{ total: number }>('/media'),
        ]);
        const extract = (d: unknown): number => {
          if (typeof d === 'object' && d !== null) {
            const obj = d as Record<string, unknown>;
            if (typeof obj.total === 'number') return obj.total;
            if (Array.isArray(obj.data)) return (obj.data as unknown[]).length;
          }
          if (Array.isArray(d)) return d.length;
          return 0;
        };
        setStats({
          pages: extract(pages.data),
          blogPosts: extract(posts.data),
          products: extract(products.data),
          mediaFiles: extract(media.data),
        });
      } catch {
        // silent
      }
    };
    void load();
  }, []);

  const cards = [
    { label: 'Pages', value: stats?.pages ?? '—', href: '/pages' },
    { label: 'Blog Posts', value: stats?.blogPosts ?? '—', href: '/blog/posts' },
    { label: 'Products', value: stats?.products ?? '—', href: '/products' },
    { label: 'Media Files', value: stats?.mediaFiles ?? '—', href: '/media' },
  ];

  return (
    <AuthGuard>
      <AdminLayout breadcrumb="Dashboard">
        <h1 className="text-lg font-semibold text-gray-900 mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {cards.map(card => (
            <a
              key={card.href}
              href={card.href}
              className="bg-white border border-gray-200 p-5 hover:border-primary transition-colors"
            >
              <p className="text-2xl font-bold text-gray-900">{String(card.value)}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </a>
          ))}
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
