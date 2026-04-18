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
  ipAddress?: string;
}

interface FormSubmissionsProps {
  params: { id: string };
}

export default function FormSubmissionsPage({ params }: FormSubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [formName, setFormName] = useState('');

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

  return (
    <AuthGuard>
      <AdminLayout breadcrumb={`Forms / ${formName} / Submissions`}>
        <h1 className="text-lg font-semibold mb-4">Submissions: {formName}</h1>
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : submissions.length === 0 ? (
          <p className="text-sm text-gray-500">No submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {submissions.map(sub => (
              <details key={sub.id} className="bg-white border border-gray-200">
                <summary className="px-4 py-3 cursor-pointer text-sm flex items-center justify-between">
                  <span className="font-mono text-xs text-gray-500">{sub.id}</span>
                  <span className="text-gray-400 text-xs">{new Date(sub.createdAt).toLocaleString()}</span>
                </summary>
                <div className="px-4 pb-3">
                  <pre className="text-xs bg-gray-50 p-3 overflow-x-auto">
                    {JSON.stringify(sub.data, null, 2)}
                  </pre>
                </div>
              </details>
            ))}
          </div>
        )}
      </AdminLayout>
    </AuthGuard>
  );
}
