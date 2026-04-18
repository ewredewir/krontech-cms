'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import api from '@/lib/api';

interface Redirect {
  id: string;
  source: string;
  destination: string;
  statusCode: 301 | 302;
  updatedAt: string;
}

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [statusCode, setStatusCode] = useState<301 | 302>(301);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await api.get<unknown>('/redirects');
      const d = res.data as { data?: Redirect[] } | Redirect[];
      setRedirects(Array.isArray(d) ? d : (d.data ?? []));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/redirects', { source, destination, statusCode });
      setSource('');
      setDestination('');
      void load();
    } catch {
      setError('Failed to create redirect');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this redirect?')) return;
    try {
      await api.delete(`/redirects/${id}`);
      setRedirects(prev => prev.filter(r => r.id !== id));
    } catch {
      setError('Delete failed');
    }
  };

  return (
    <AuthGuard>
      <AdminLayout breadcrumb="Redirects">
        <h1 className="text-lg font-semibold mb-4">Redirects</h1>

        {/* Create form */}
        <form onSubmit={(e) => { void handleCreate(e); }} className="bg-white border border-gray-200 p-4 mb-4 flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-40">
            <label htmlFor="source" className="block text-xs font-medium mb-1">Source path</label>
            <input id="source" value={source} onChange={e => setSource(e.target.value)} placeholder="/old-path"
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary" required />
          </div>
          <div className="flex-1 min-w-40">
            <label htmlFor="destination" className="block text-xs font-medium mb-1">Destination</label>
            <input id="destination" value={destination} onChange={e => setDestination(e.target.value)} placeholder="/new-path"
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary" required />
          </div>
          <div>
            <label htmlFor="statusCode" className="block text-xs font-medium mb-1">Type</label>
            <select id="statusCode" value={statusCode} onChange={e => setStatusCode(Number(e.target.value) as 301 | 302)}
              className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option value={301}>301 Permanent</option>
              <option value={302}>302 Temporary</option>
            </select>
          </div>
          <button type="submit" disabled={saving}
            className="bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Adding…' : 'Add'}
          </button>
          {error && <p className="text-red-500 text-xs w-full">{error}</p>}
        </form>

        <div className="bg-white border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Destination</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : redirects.map(r => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-mono text-xs">{r.source}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.destination}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.statusCode}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => { void handleDelete(r.id); }} className="text-red-500 hover:underline text-xs">Delete</button>
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
