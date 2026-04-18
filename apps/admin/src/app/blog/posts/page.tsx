'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import api from '@/lib/api';

interface BlogPost {
  id: string;
  title: { tr: string; en: string };
  slug: { tr: string; en: string };
  status: string;
  updatedAt: string;
  category?: { name: { tr: string; en: string } };
}

export default function BlogPostsListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const load = async (page: number) => {
    setLoading(true);
    try {
      const res = await api.get<unknown>('/blog/posts', { params: { page, limit: LIMIT } });
      const d = res.data as { data?: BlogPost[]; total?: number } | BlogPost[];
      setPosts(Array.isArray(d) ? d : (d.data ?? []));
      setTotal(Array.isArray(d) ? d.length : (d.total ?? 0));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(currentPage); }, [currentPage]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await api.delete(`/blog/posts/${id}`);
      void load(currentPage);
    } catch {
      // silent
    }
  };

  const STATUS_COLOR: Record<string, string> = {
    DRAFT: 'text-gray-500', PUBLISHED: 'text-green-600', SCHEDULED: 'text-yellow-600',
  };

  return (
    <AuthGuard>
      <AdminLayout breadcrumb="Blog / Posts">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">Blog Posts</h1>
          <Link href="/blog/posts/create" className="bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-blue-700">
            + New Post
          </Link>
        </div>
        <div className="bg-white border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title (TR)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : posts.map(post => (
                <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{post.title?.tr ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{post.category?.name?.tr ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${STATUS_COLOR[post.status] ?? 'text-gray-500'}`}>{post.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(post.updatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/blog/posts/${post.id}/edit`} className="text-primary hover:underline text-xs mr-3">Edit</Link>
                    <button type="button" onClick={() => { void handleDelete(post.id, post.title?.tr ?? post.id); }} className="text-red-500 hover:underline text-xs">Delete</button>
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
