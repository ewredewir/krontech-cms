'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import api from '@/lib/api';

interface Category {
  id: string;
  name: { tr: string; en: string };
  slug: string;
}

const toSlug = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const emptyForm = { nameTr: '', nameEn: '', slug: '' };

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown>('/blog/categories');
      const d = res.data as { data?: Category[] } | Category[];
      setCategories(Array.isArray(d) ? d : (d.data ?? []));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({ nameTr: cat.name?.tr ?? '', nameEn: cat.name?.en ?? '', slug: cat.slug ?? '' });
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSave = async () => {
    if (!form.nameTr || !form.slug) { setError('Name TR and slug are required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { name: { tr: form.nameTr, en: form.nameEn }, slug: form.slug };
      if (editingId && editingId !== 'new') {
        await api.patch(`/blog/categories/${editingId}`, payload);
      } else {
        await api.post('/blog/categories', payload);
      }
      cancelEdit();
      await load();
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Posts in this category will be uncategorized.')) return;
    try {
      await api.delete(`/blog/categories/${id}`);
      await load();
    } catch {
      setError('Delete failed');
    }
  };

  return (
    <AuthGuard>
      <AdminLayout breadcrumb="Blog / Categories">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">Blog Categories</h1>
          {!editingId && (
            <button onClick={() => { setEditingId('new'); setForm(emptyForm); setError(''); }}
              className="bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-blue-700">
              + Add Category
            </button>
          )}
        </div>

        {(editingId !== null) && (
          <div className="bg-white border border-gray-200 p-4 mb-4 space-y-3">
            <h2 className="text-sm font-semibold">{editingId === 'new' ? 'New Category' : 'Edit Category'}</h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Name TR</label>
                <input value={form.nameTr} onChange={e => setForm(f => ({ ...f, nameTr: e.target.value, slug: editingId === 'new' ? toSlug(e.target.value) : f.slug }))}
                  className="w-full border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Name EN</label>
                <input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Slug</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className="w-full border border-gray-300 px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-primary" />
              </div>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => { void handleSave(); }} disabled={saving}
                className="bg-primary text-white px-3 py-1.5 text-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={cancelEdit} className="border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name (TR)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name (EN)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No categories yet.</td></tr>
              ) : categories.map(cat => (
                <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{cat.name?.tr}</td>
                  <td className="px-4 py-3">{cat.name?.en}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{cat.slug}</td>
                  <td className="px-4 py-3 text-right flex gap-3 justify-end">
                    <button onClick={() => startEdit(cat)} className="text-xs text-primary hover:underline">Edit</button>
                    <button onClick={() => { void handleDelete(cat.id); }} className="text-xs text-red-500 hover:underline">Delete</button>
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
