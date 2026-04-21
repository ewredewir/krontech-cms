'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import api from '@/lib/api';

interface Submission {
  id: string;
  data: Record<string, unknown>;
  createdAt: string;
  ip: string;
  consentGiven: boolean;
}

interface FormSubmissionsProps {
  params: { id: string };
}

export default function FormSubmissionsPage({ params }: FormSubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [formName, setFormName] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void Promise.all([
      api.get<unknown>(`/forms/${params.id}`),
      api.get<unknown>(`/forms/${params.id}/submissions`),
    ]).then(([formRes, subsRes]) => {
      const f = formRes.data as { name?: string };
      setFormName(f.name ?? params.id);
      const d = subsRes.data as { data?: Submission[] } | Submission[];
      setSubmissions(Array.isArray(d) ? d : (d.data ?? []));
    }).finally(() => setLoading(false));
  }, [params.id]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/forms/${params.id}/submissions/export`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submissions-${params.id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AuthGuard>
      <AdminLayout breadcrumb={`Forms / ${formName} / Submissions`}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">Submissions: {formName}</h1>
          <button
            onClick={handleExport}
            disabled={exporting || submissions.length === 0}
            className="text-xs border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : submissions.length === 0 ? (
          <p className="text-sm text-gray-500">No submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-white border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <span className="font-mono text-xs text-gray-400">{sub.id}</span>
                  <span className="text-gray-400 text-xs">{new Date(sub.createdAt).toLocaleString()}</span>
                </div>
                <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  {Object.entries(sub.data).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-xs text-gray-400 block mb-0.5 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value ?? '')}
                        className="w-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 outline-none"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-gray-400 block mb-0.5">IP</label>
                    <input
                      type="text"
                      readOnly
                      value={sub.ip}
                      className="w-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-0.5">Consent</label>
                    <input
                      type="text"
                      readOnly
                      value={sub.consentGiven ? 'Given' : 'Not given'}
                      className="w-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminLayout>
    </AuthGuard>
  );
}
