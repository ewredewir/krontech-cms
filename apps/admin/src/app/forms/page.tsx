'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import api from '@/lib/api';

interface Form {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
  _count?: { submissions: number };
}

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api.get<unknown>('/forms').then(res => {
      const d = res.data as { data?: Form[] } | Form[];
      setForms(Array.isArray(d) ? d : (d.data ?? []));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard>
      <AdminLayout breadcrumb="Forms">
        <h1 className="text-lg font-semibold mb-4">Forms</h1>
        <div className="bg-white border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Submissions</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : forms.map(form => (
                <tr key={form.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{form.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{form.slug}</td>
                  <td className="px-4 py-3 text-gray-500">{form._count?.submissions ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(form.updatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/forms/${form.id}/submissions`} className="text-primary hover:underline text-xs">Submissions</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
