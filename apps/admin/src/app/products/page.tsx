'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import api from '@/lib/api';

interface Product {
  id: string;
  name: { tr: string; en: string };
  slug: { tr: string; en: string };
  status: string;
  updatedAt: string;
}

export default function ProductsListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 20;

  const load = async (page: number) => {
    setLoading(true);
    try {
      const res = await api.get<unknown>('/products', { params: { page, limit: LIMIT } });
      const d = res.data as { data?: Product[]; total?: number } | Product[];
      setProducts(Array.isArray(d) ? d : (d.data ?? []));
      setTotal(Array.isArray(d) ? d.length : (d.total ?? 0));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(currentPage); }, [currentPage]);

  const STATUS_COLOR: Record<string, string> = {
    DRAFT: 'text-gray-500', PUBLISHED: 'text-green-600', SCHEDULED: 'text-yellow-600',
  };

  return (
    <AuthGuard>
      <AdminLayout breadcrumb="Products">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">Products</h1>
        </div>
        <div className="bg-white border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name (TR)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : products.map(product => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{product.name?.tr ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{product.slug?.tr ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${STATUS_COLOR[product.status] ?? 'text-gray-500'}`}>{product.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(product.updatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/products/${product.id}/edit`} className="text-primary hover:underline text-xs">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > LIMIT && (
          <div className="flex gap-2 mt-4 justify-center">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border border-gray-300 text-sm disabled:opacity-40">← Prev</button>
            <span className="px-3 py-1 text-sm text-gray-500">{currentPage} / {Math.ceil(total / LIMIT)}</span>
            <button disabled={currentPage * LIMIT >= total} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border border-gray-300 text-sm disabled:opacity-40">Next →</button>
          </div>
        )}
      </AdminLayout>
    </AuthGuard>
  );
}
