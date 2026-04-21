'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { PageComponentEditor } from '@/components/editors/PageComponentEditor';
import { SeoMetaPanel } from '@/components/seo/SeoMetaPanel';
import { PublishControls } from '@/components/publish/PublishControls';
import api from '@/lib/api';

interface PageData {
  id: string;
  slug: { tr: string; en: string };
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  scheduledAt?: string;
  seo?: Record<string, unknown>;
  components: Array<{
    id: string;
    type: string;
    order: number;
    data: Record<string, unknown>;
    hasDraft: boolean;
  }>;
}

interface EditPageProps {
  params: { id: string };
}

export default function EditPagePage({ params }: EditPageProps) {
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [locale, setLocale] = useState<'tr' | 'en'>('tr');
  const [hasPendingDrafts, setHasPendingDrafts] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<PageData>(`/pages/${params.id}`);
      setPage(res.data);
    } catch {
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [params.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page) return;
    setSaving(true);
    try {
      await api.patch(`/pages/${params.id}`, {
        slug: page.slug,
      });
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <AuthGuard>
      <AdminLayout breadcrumb="Pages / Edit">
        <p className="text-sm text-gray-400">Loading…</p>
      </AdminLayout>
    </AuthGuard>
  );

  if (error || !page) return (
    <AuthGuard>
      <AdminLayout breadcrumb="Pages / Edit">
        <p className="text-red-500 text-sm">{error || 'Page not found'}</p>
      </AdminLayout>
    </AuthGuard>
  );

  return (
    <AuthGuard>
      <AdminLayout breadcrumb={`Pages / ${page.slug?.[locale] || params.id}`}>
        <div className="grid grid-cols-3 gap-6">
          {/* Main editor */}
          <div className="col-span-2 space-y-6">
            {/* Basic fields */}
            <section className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">Page Details</h2>
                <div className="flex gap-1">
                  {(['tr', 'en'] as const).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLocale(l)}
                      className={`px-3 py-1 text-xs border ${locale === l ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:bg-gray-50'}`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <form onSubmit={(e) => { void handleSave(e); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Slug ({locale.toUpperCase()})</label>
                  <input
                    value={page.slug?.[locale] ?? ''}
                    onChange={e => setPage(p => p ? { ...p, slug: { ...p.slug, [locale]: e.target.value } } : p)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </section>

            {/* Component editor */}
            <section className="bg-white border border-gray-200 p-6">
              <PageComponentEditor
                pageId={page.id}
                initialComponents={page.components ?? []}
                onDraftStateChange={setHasPendingDrafts}
              />
            </section>

            {/* SEO panel */}
            <SeoMetaPanel
              entityType="page"
              entityId={page.id}
              locale={locale}
              initialData={page.seo as Parameters<typeof SeoMetaPanel>[0]['initialData']}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <PublishControls
              entityType="page"
              entityId={page.id}
              currentStatus={page.status}
              scheduledAt={page.scheduledAt}
              hasPendingDrafts={hasPendingDrafts}
              onStatusChange={() => { void load(); }}
            />
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
