'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
}

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    void api.get<unknown>('/users').then(res => {
      const d = res.data as { data?: User[] } | User[];
      setUsers(Array.isArray(d) ? d : (d.data ?? []));
    }).finally(() => setLoading(false));
  }, [user, router]);

  return (
    <AuthGuard>
      <AdminLayout breadcrumb="Users">
        <h1 className="text-lg font-semibold mb-4">Users</h1>
        <div className="bg-white border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${u.role === 'ADMIN' ? 'text-primary' : 'text-gray-500'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-500">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
