'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { SeoMetaPanel } from '@/components/seo/SeoMetaPanel';
import { PublishControls } from '@/components/publish/PublishControls';
import { MediaPicker } from '@/components/media/MediaPicker';
import api from '@/lib/api';

interface MediaItem {
  id: string;
  publicUrl: string;
  originalName: string;
  mimeType: string;
  altText: { tr: string; en: string };
  blurDataUrl: string | null;
  width: number | null;
  height: number | null;
}

interface ProductMedia {
  id: string;
  order: number;
  media: MediaItem;
}

interface Product {
  id: string;
  name: { tr: string; en: string };
  slug: { tr: string; en: string };
  description: { tr: string; en: string };
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  scheduledAt?: string;
  seo?: Record<string, unknown>;
  mediaItems: ProductMedia[];
}

interface EditProductProps {
  params: { id: string };
}

export default function EditProductPage({ params }: EditProductProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [locale, setLocale] = useState<'tr' | 'en'>('tr');
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<Product>(`/products/${params.id}`);
      setProduct(res.data);
    } catch {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [params.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSaving(true);
    try {
      await api.patch(`/products/${params.id}`, {
        name: product.name,
        slug: product.slug,
        description: product.description,
      });
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setField = (field: 'name' | 'slug' | 'description', lang: 'tr' | 'en', val: string) => {
    setProduct(p => p ? { ...p, [field]: { ...(p[field] ?? {}), [lang]: val } } : p);
  };

  const handleAddMedia = async (media: MediaItem) => {
    try {
      await api.post(`/products/${params.id}/media/${media.id}`);
      void load();
    } catch {
      setError('Failed to add media');
    }
  };

  const handleRemoveMedia = async (mediaId: string) => {
    try {
      await api.delete(`/products/${params.id}/media/${mediaId}`);
      void load();
    } catch {
      setError('Failed to remove media');
    }
  };

  const handleReorderMedia = async (mediaItems: ProductMedia[]) => {
    setProduct(p => p ? { ...p, mediaItems } : p);
    try {
      await api.post(`/products/${params.id}/media/reorder`, {
        mediaItems: mediaItems.map((m, i) => ({ mediaId: m.media.id, order: i })),
      });
    } catch {
      setError('Reorder failed');
    }
  };

  const moveMedia = (idx: number, dir: -1 | 1) => {
    if (!product) return;
    const items = [...product.mediaItems];
    const swap = idx + dir;
    if (swap < 0 || swap >= items.length) return;
    [items[idx], items[swap]] = [items[swap], items[idx]];
    void handleReorderMedia(items);
  };

  if (loading) return <AuthGuard><AdminLayout breadcrumb="Products / Edit"><p className="text-sm text-gray-400">Loading…</p></AdminLayout></AuthGuard>;
  if (!product) return <AuthGuard><AdminLayout breadcrumb="Products / Edit"><p className="text-red-500 text-sm">{error || 'Not found'}</p></AdminLayout></AuthGuard>;

  return (
    <AuthGuard>
      <AdminLayout breadcrumb={`Products / ${product.name?.tr ?? params.id}`}>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <section className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">Product Details</h2>
                <div className="flex gap-1">
                  {(['tr', 'en'] as const).map(l => (
                    <button key={l} type="button" onClick={() => setLocale(l)}
                      className={`px-3 py-1 text-xs border ${locale === l ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:bg-gray-50'}`}>
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <form onSubmit={(e) => { void handleSave(e); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name ({locale.toUpperCase()})</label>
                  <input value={product.name?.[locale] ?? ''} onChange={e => setField('name', locale, e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug ({locale.toUpperCase()})</label>
                  <input value={product.slug?.[locale] ?? ''} onChange={e => setField('slug', locale, e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary" />
                </div>
                <RichTextEditor
                  label="Description"
                  locale={locale}
                  value={product.description?.[locale] ?? ''}
                  onChange={val => setField('description', locale, val)}
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" disabled={saving}
                  className="bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </section>

            {/* Media gallery */}
            <section className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">Media Gallery</h2>
                <button type="button" onClick={() => setPickerOpen(true)}
                  className="text-sm text-primary hover:underline">+ Add Media</button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {(product.mediaItems ?? [])
                  .sort((a, b) => a.order - b.order)
                  .map((pm, idx, arr) => (
                    <div key={pm.id} className="border border-gray-200 relative group">
                      <div className="aspect-square bg-gray-100 relative">
                        {pm.media.mimeType.startsWith('image/') && (
                          <Image
                            src={pm.media.publicUrl}
                            alt={pm.media.altText?.tr ?? ''}
                            fill
                            className="object-cover"
                            sizes="120px"
                            placeholder={pm.media.blurDataUrl ? 'blur' : 'empty'}
                            blurDataURL={pm.media.blurDataUrl ?? undefined}
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="flex justify-between items-center px-1.5 py-1">
                        <div className="flex gap-1">
                          <button type="button" disabled={idx === 0} onClick={() => moveMedia(idx, -1)} className="text-gray-400 text-xs disabled:opacity-30">↑</button>
                          <button type="button" disabled={idx === arr.length - 1} onClick={() => moveMedia(idx, 1)} className="text-gray-400 text-xs disabled:opacity-30">↓</button>
                        </div>
                        <button type="button" onClick={() => { void handleRemoveMedia(pm.media.id); }} className="text-xs text-red-500 hover:underline">×</button>
                      </div>
                    </div>
                  ))}
              </div>
              <MediaPicker open={pickerOpen} onSelect={m => { void handleAddMedia(m); }} onClose={() => setPickerOpen(false)} />
            </section>

            <SeoMetaPanel entityType="product" entityId={product.id} locale={locale}
              initialData={product.seo as Parameters<typeof SeoMetaPanel>[0]['initialData']} />
          </div>
          <div>
            <PublishControls entityType="product" entityId={product.id} currentStatus={product.status}
              scheduledAt={product.scheduledAt} onStatusChange={() => { void load(); }} />
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
