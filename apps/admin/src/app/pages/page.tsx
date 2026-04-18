'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import api from '@/lib/api';

interface Page {
  id: string;
  slug: { tr: string; en: string };
  title: { tr: string; en: string };
  status: string;
  updatedAt: string;
}

interface PaginatedResponse {
  data: Page[];
  total: number;
  page: number;
  limit: number;
}

export default function PagesListPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const LIMIT = 20;

  const load = async (page: number) => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse>('/pages', {
        params: { page, limit: LIMIT },
      });
      const d = res.data;
      setPages(Array.isArray(d) ? (d as unknown as Page[]) : (d.data ?? []));
      setTotal(Array.isArray(d) ? (d as unknown as Page[]).length : (d.total ?? 0));
    } catch {
      setError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(currentPage); }, [currentPage]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete page "${title}"?`)) return;
    try {
      await api.delete(`/pages/${id}`);
      void load(currentPage);
    } catch {
      setError('Delete failed');
    }
  };

  const STATUS_COLOR: Record<string, string> = {
    DRAFT: 'text-gray-500',
    PUBLISHED: 'text-green-600',
    SCHEDULED: 'text-yellow-600',
  };

  return (
    <AuthGuard>
      <AdminLayout breadcrumb="Pages">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">Pages</h1>
          <Link href="/pages/create" className="bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-blue-700">
            + New Page
          </Link>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="bg-white border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title (TR)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : pages.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No pages found</td></tr>
              ) : pages.map(page => (
                <tr key={page.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{page.title?.tr ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{page.slug?.tr ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${STATUS_COLOR[page.status] ?? 'text-gray-500'}`}>
                      {page.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(page.updatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/pages/${page.id}/edit`} className="text-primary hover:underline text-xs mr-3">Edit</Link>
                    <button
                      type="button"
                      onClick={() => { void handleDelete(page.id, page.title?.tr ?? page.id); }}
                      className="text-red-500 hover:underline text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > LIMIT && (
          <div className="flex gap-2 mt-4 justify-center">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-3 py-1 border border-gray-300 text-sm disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="px-3 py-1 text-sm text-gray-500">
              {currentPage} / {Math.ceil(total / LIMIT)}
            </span>
            <button
              disabled={currentPage * LIMIT >= total}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-3 py-1 border border-gray-300 text-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </AdminLayout>
    </AuthGuard>
  );
}
