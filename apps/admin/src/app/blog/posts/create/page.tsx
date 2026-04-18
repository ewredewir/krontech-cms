'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import api from '@/lib/api';

interface Category {
  id: string;
  name: { tr: string; en: string };
}

export default function CreateBlogPostPage() {
  const router = useRouter();
  const [titleTr, setTitleTr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [slugTr, setSlugTr] = useState('');
  const [slugEn, setSlugEn] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void api.get<unknown>('/blog/categories').then(res => {
      const d = res.data as { data?: Category[] } | Category[];
      setCategories(Array.isArray(d) ? d : (d.data ?? []));
    });
  }, []);

  const toSlug = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.post<{ id: string }>('/blog/posts', {
        title: { tr: titleTr, en: titleEn },
        slug: { tr: slugTr, en: slugEn },
        categoryId: categoryId || undefined,
        excerpt: { tr: '', en: '' },
        body: { tr: '', en: '' },
      });
      router.push(`/blog/posts/${res.data.id}/edit`);
    } catch {
      setError('Failed to create post');
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <AdminLayout breadcrumb="Blog / New Post">
        <div className="max-w-xl">
          <h1 className="text-lg font-semibold mb-4">New Blog Post</h1>
          <form onSubmit={(e) => { void handleSubmit(e); }} className="bg-white border border-gray-200 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="titleTr" className="block text-sm font-medium mb-1">Title TR</label>
                <input id="titleTr" value={titleTr} onChange={e => { setTitleTr(e.target.value); setSlugTr(toSlug(e.target.value)); }} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary" required />
              </div>
              <div>
                <label htmlFor="titleEn" className="block text-sm font-medium mb-1">Title EN</label>
                <input id="titleEn" value={titleEn} onChange={e => { setTitleEn(e.target.value); setSlugEn(toSlug(e.target.value)); }} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="slugTr" className="block text-sm font-medium mb-1">Slug TR</label>
                <input id="slugTr" value={slugTr} onChange={e => setSlugTr(e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary" required />
              </div>
              <div>
                <label htmlFor="slugEn" className="block text-sm font-medium mb-1">Slug EN</label>
                <input id="slugEn" value={slugEn} onChange={e => setSlugEn(e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary" required />
              </div>
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
              <select id="category" value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value="">— No category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name?.tr}</option>)}
              </select>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={saving} className="bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Post'}
            </button>
          </form>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
