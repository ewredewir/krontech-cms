'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import api from '@/lib/api';

interface Tag {
  id: string;
  name: { tr: string; en: string };
  slug: { tr: string; en: string };
}

export default function BlogTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api.get<unknown>('/blog/tags').then(res => {
      const d = res.data as { data?: Tag[] } | Tag[];
      setTags(Array.isArray(d) ? d : (d.data ?? []));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard>
      <AdminLayout breadcrumb="Blog / Tags">
        <h1 className="text-lg font-semibold mb-4">Blog Tags</h1>
        <div className="bg-white border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name (TR)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name (EN)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : tags.map(tag => (
                <tr key={tag.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{tag.name?.tr}</td>
                  <td className="px-4 py-3">{tag.name?.en}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
