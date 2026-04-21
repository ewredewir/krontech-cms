'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import api from '@/lib/api';

export default function CreateProductPage() {
  const router = useRouter();
  const [nameTr, setNameTr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slugTr, setSlugTr] = useState('');
  const [slugEn, setSlugEn] = useState('');
  const [taglineTr, setTaglineTr] = useState('');
  const [taglineEn, setTaglineEn] = useState('');
  const [descriptionTr, setDescriptionTr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [locale, setLocale] = useState<'tr' | 'en'>('tr');
  const [featuredImageId, setFeaturedImageId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toSlug = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.post<{ id: string }>('/products', {
        name: { tr: nameTr, en: nameEn },
        slug: { tr: slugTr, en: slugEn },
        tagline: { tr: taglineTr, en: taglineEn },
        description: { tr: descriptionTr, en: descriptionEn },
      });
      const productId = res.data.id;
      if (featuredImageId) {
        await api.post(`/products/${productId}/media/${featuredImageId}`);
      }
      router.push(`/products/${productId}/edit`);
    } catch {
      setError('Failed to create product');
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <AdminLayout breadcrumb="Products / New Product">
        <div className="max-w-xl">
          <h1 className="text-lg font-semibold mb-4">New Product</h1>
          <form onSubmit={(e) => { void handleSubmit(e); }} className="bg-white border border-gray-200 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nameTr" className="block text-sm font-medium mb-1">Name TR</label>
                <input id="nameTr" value={nameTr} onChange={e => { setNameTr(e.target.value); setSlugTr(toSlug(e.target.value)); }}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary" required />
              </div>
              <div>
                <label htmlFor="nameEn" className="block text-sm font-medium mb-1">Name EN</label>
                <input id="nameEn" value={nameEn} onChange={e => { setNameEn(e.target.value); setSlugEn(toSlug(e.target.value)); }}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="taglineTr" className="block text-sm font-medium mb-1">Tagline TR</label>
                <input id="taglineTr" value={taglineTr} onChange={e => setTaglineTr(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label htmlFor="taglineEn" className="block text-sm font-medium mb-1">Tagline EN</label>
                <input id="taglineEn" value={taglineEn} onChange={e => setTaglineEn(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="slugTr" className="block text-sm font-medium mb-1">Slug TR</label>
                <input id="slugTr" value={slugTr} onChange={e => setSlugTr(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary" required />
              </div>
              <div>
                <label htmlFor="slugEn" className="block text-sm font-medium mb-1">Slug EN</label>
                <input id="slugEn" value={slugEn} onChange={e => setSlugEn(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary" required />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Description</label>
                <div className="flex gap-1">
                  {(['tr', 'en'] as const).map(l => (
                    <button key={l} type="button" onClick={() => setLocale(l)}
                      className={`px-3 py-1 text-xs border ${locale === l ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:bg-gray-50'}`}>
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <RichTextEditor
                label=""
                locale={locale}
                value={locale === 'tr' ? descriptionTr : descriptionEn}
                onChange={val => locale === 'tr' ? setDescriptionTr(val) : setDescriptionEn(val)}
              />
            </div>

            <div>
              <label htmlFor="featuredImageId" className="block text-sm font-medium mb-1">Image ID (UUID)</label>
              <input
                id="featuredImageId"
                value={featuredImageId}
                onChange={e => setFeaturedImageId(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
                placeholder="Paste media UUID"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={saving}
              className="bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Product'}
            </button>
          </form>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
