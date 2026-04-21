'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { MediaPicker } from '@/components/media/MediaPicker';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import api from '@/lib/api';
import { toPublicUrl } from '@/lib/media';

interface Category {
  id: string;
  name: { tr: string; en: string };
}

interface Tag {
  id: string;
  name: { tr: string; en: string };
}

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

export default function CreateBlogPostPage() {
  const router = useRouter();
  const [titleTr, setTitleTr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [slugTr, setSlugTr] = useState('');
  const [slugEn, setSlugEn] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [bodyTr, setBodyTr] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [locale, setLocale] = useState<'tr' | 'en'>('tr');
  const [featuredImage, setFeaturedImage] = useState<MediaItem | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void api.get<unknown>('/blog/categories').then(res => {
      const d = res.data as { data?: Category[] } | Category[];
      setCategories(Array.isArray(d) ? d : (d.data ?? []));
    });
    void api.get<unknown>('/blog/tags').then(res => {
      const d = res.data as { data?: Tag[] } | Tag[];
      setTags(Array.isArray(d) ? d : (d.data ?? []));
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
        tagIds: selectedTagIds,
        featuredImageId: featuredImage?.id ?? undefined,
        excerpt: { tr: '', en: '' },
        body: { tr: bodyTr, en: bodyEn },
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
            {tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => {
                    const selected = selectedTagIds.includes(tag.id);
                    return (
                      <button key={tag.id} type="button"
                        onClick={() => setSelectedTagIds(ids => selected ? ids.filter(id => id !== tag.id) : [...ids, tag.id])}
                        className={`px-3 py-1 text-xs border transition-colors ${selected ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:bg-gray-50'}`}>
                        {tag.name?.tr}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Body</label>
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
                value={locale === 'tr' ? bodyTr : bodyEn}
                onChange={val => locale === 'tr' ? setBodyTr(val) : setBodyEn(val)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Featured Image</label>
                <button type="button" onClick={() => setPickerOpen(true)} className="text-sm text-primary hover:underline">
                  {featuredImage ? 'Change' : '+ Select Image'}
                </button>
              </div>
              {featuredImage && (
                <div className="flex items-center gap-3 border border-gray-200 p-2">
                  <div className="w-16 h-16 bg-gray-100 relative flex-shrink-0">
                    {featuredImage.mimeType.startsWith('image/') && (
                      <Image
                        src={toPublicUrl(featuredImage.publicUrl)}
                        alt={featuredImage.altText?.tr ?? featuredImage.originalName}
                        fill
                        className="object-cover"
                        sizes="64px"
                        placeholder={featuredImage.blurDataUrl ? 'blur' : 'empty'}
                        blurDataURL={featuredImage.blurDataUrl ?? undefined}
                        unoptimized
                      />
                    )}
                  </div>
                  <span className="text-sm text-gray-600 truncate flex-1">{featuredImage.originalName}</span>
                  <button type="button" onClick={() => setFeaturedImage(null)} className="text-xs text-red-500 hover:underline flex-shrink-0">Remove</button>
                </div>
              )}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={saving} className="bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Post'}
            </button>
          </form>
        </div>

        <MediaPicker open={pickerOpen} onSelect={setFeaturedImage} onClose={() => setPickerOpen(false)} />
      </AdminLayout>
    </AuthGuard>
  );
}
