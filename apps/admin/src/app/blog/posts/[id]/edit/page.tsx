'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { SeoMetaPanel } from '@/components/seo/SeoMetaPanel';
import { PublishControls } from '@/components/publish/PublishControls';
import api from '@/lib/api';

interface BlogPost {
  id: string;
  title: { tr: string; en: string };
  slug: { tr: string; en: string };
  excerpt: { tr: string; en: string };
  body: { tr: string; en: string };
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  scheduledAt?: string;
  seo?: Record<string, unknown>;
}

interface EditBlogPostProps {
  params: { id: string };
}

export default function EditBlogPostPage({ params }: EditBlogPostProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [locale, setLocale] = useState<'tr' | 'en'>('tr');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<BlogPost>(`/blog/posts/${params.id}`);
      setPost(res.data);
    } catch {
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [params.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    setSaving(true);
    try {
      await api.patch(`/blog/posts/${params.id}`, {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        body: post.body,
      });
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setField = <K extends keyof BlogPost>(
    field: K,
    lang: 'tr' | 'en',
    val: string
  ) => {
    setPost(p => {
      if (!p) return p;
      const existing = (p[field] as { tr: string; en: string }) ?? { tr: '', en: '' };
      return { ...p, [field]: { ...existing, [lang]: val } };
    });
  };

  if (loading) return <AuthGuard><AdminLayout breadcrumb="Blog / Edit"><p className="text-sm text-gray-400">Loading…</p></AdminLayout></AuthGuard>;
  if (!post) return <AuthGuard><AdminLayout breadcrumb="Blog / Edit"><p className="text-red-500 text-sm">{error || 'Not found'}</p></AdminLayout></AuthGuard>;

  return (
    <AuthGuard>
      <AdminLayout breadcrumb={`Blog / ${post.title?.tr ?? params.id}`}>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <section className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">Post Details</h2>
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
                  <label className="block text-sm font-medium mb-1">Title ({locale.toUpperCase()})</label>
                  <input value={post.title?.[locale] ?? ''} onChange={e => setField('title', locale, e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug ({locale.toUpperCase()})</label>
                  <input value={post.slug?.[locale] ?? ''} onChange={e => setField('slug', locale, e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Excerpt ({locale.toUpperCase()})</label>
                  <textarea value={post.excerpt?.[locale] ?? ''} onChange={e => setField('excerpt', locale, e.target.value)}
                    rows={2} className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <RichTextEditor
                  label="Content"
                  locale={locale}
                  value={post.body?.[locale] ?? ''}
                  onChange={val => setField('body', locale, val)}
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" disabled={saving}
                  className="bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </section>
            <SeoMetaPanel entityType="blog" entityId={post.id} locale={locale}
              initialData={post.seo as Parameters<typeof SeoMetaPanel>[0]['initialData']} />
          </div>
          <div>
            <PublishControls entityType="blog" entityId={post.id} currentStatus={post.status}
              scheduledAt={post.scheduledAt} onStatusChange={() => { void load(); }} />
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
