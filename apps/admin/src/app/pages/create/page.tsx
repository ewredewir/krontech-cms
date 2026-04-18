'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import api from '@/lib/api';

export default function CreatePagePage() {
  const router = useRouter();
  const [slugTr, setSlugTr] = useState('');
  const [slugEn, setSlugEn] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toSlug = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.post<{ id: string }>('/pages', {
        slug: { tr: slugTr, en: slugEn },
      });
      router.push(`/pages/${res.data.id}/edit`);
    } catch {
      setError('Failed to create page');
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <AdminLayout breadcrumb="Pages / New">
        <div className="max-w-xl">
          <h1 className="text-lg font-semibold mb-4">New Page</h1>
          <form onSubmit={(e) => { void handleSubmit(e); }} className="bg-white border border-gray-200 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="slugTr" className="block text-sm font-medium mb-1">Slug TR</label>
                <input
                  id="slugTr"
                  value={slugTr}
                  onChange={e => setSlugTr(toSlug(e.target.value))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label htmlFor="slugEn" className="block text-sm font-medium mb-1">Slug EN</label>
                <input
                  id="slugEn"
                  value={slugEn}
                  onChange={e => setSlugEn(toSlug(e.target.value))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Page'}
            </button>
          </form>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
