'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import api from '@/lib/api';

interface NavItem {
  id: string;
  locale: string;
  label: string;
  href: string | null;
  order: number;
  isActive: boolean;
  parentId: string | null;
}

const EMPTY: Omit<NavItem, 'id'> = {
  locale: 'tr',
  label: '',
  href: '',
  order: 0,
  isActive: true,
  parentId: null,
};

export default function NavigationPage() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<NavItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<NavItem, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<NavItem[]>('/navigation');
      setItems(res.data);
    } catch {
      setError('Failed to load navigation items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setCreating(true);
  };

  const openEdit = (item: NavItem) => {
    setCreating(false);
    setForm({
      locale: item.locale,
      label: item.label,
      href: item.href ?? '',
      order: item.order,
      isActive: item.isActive,
      parentId: item.parentId,
    });
    setEditing(item);
  };

  const closeForm = () => { setEditing(null); setCreating(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, href: form.href || null, parentId: form.parentId || null };
      if (creating) {
        await api.post('/navigation', payload);
      } else if (editing) {
        await api.patch(`/navigation/${editing.id}`, payload);
      }
      closeForm();
      void load();
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: NavItem) => {
    if (!confirm(`Delete "${item.label}"? Its children will also be deleted.`)) return;
    try {
      await api.delete(`/navigation/${item.id}`);
      void load();
    } catch {
      setError('Delete failed');
    }
  };

  const roots = items.filter((i) => !i.parentId);
  const localeGroups = ['tr', 'en'];

  return (
    <AuthGuard>
      <AdminLayout breadcrumb="Navigation">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">Navigation</h1>
          <button
            type="button"
            onClick={openCreate}
            className="bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            + New Item
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {(creating || editing) && (
          <div className="bg-white border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold mb-4">{creating ? 'Create Navigation Item' : 'Edit Navigation Item'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Locale</label>
                <select
                  value={form.locale}
                  onChange={(e) => setForm({ ...form, locale: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="tr">TR</option>
                  <option value="en">EN</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Label *</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. Ürünler"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Href (leave empty for dropdown)</label>
                <input
                  type="text"
                  value={form.href ?? ''}
                  onChange={(e) => setForm({ ...form, href: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm"
                  placeholder="/tr/blog"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Parent (optional)</label>
                <select
                  value={form.parentId ?? ''}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value || null })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">— none (top-level) —</option>
                  {roots.filter((r) => r.locale === form.locale).map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !form.label.trim()}
                className="bg-primary text-white px-5 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="border border-gray-300 px-5 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {localeGroups.map((locale) => {
          const localeRoots = items.filter((i) => i.locale === locale && !i.parentId);
          if (localeRoots.length === 0 && !loading) return null;
          return (
            <div key={locale} className="mb-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {locale.toUpperCase()}
              </h2>
              <div className="bg-white border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Label</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Href</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Parent</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
                    ) : (
                      items
                        .filter((i) => i.locale === locale)
                        .sort((a, b) => {
                          if (!a.parentId && b.parentId) return -1;
                          if (a.parentId && !b.parentId) return 1;
                          return a.order - b.order;
                        })
                        .map((item) => (
                          <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 ${item.parentId ? 'bg-gray-50/50' : ''}`}>
                            <td className="px-4 py-3">
                              {item.parentId && <span className="text-gray-300 mr-2">↳</span>}
                              {item.label}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.href ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-500">{item.order}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium ${item.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                {item.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400">
                              {item.parentId ? (items.find((p) => p.id === item.parentId)?.label ?? item.parentId.slice(0, 8)) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => openEdit(item)}
                                className="text-primary hover:underline text-xs mr-3"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => { void handleDelete(item); }}
                                className="text-red-500 hover:underline text-xs"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </AdminLayout>
    </AuthGuard>
  );
}
