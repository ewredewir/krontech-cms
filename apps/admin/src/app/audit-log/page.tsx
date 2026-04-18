'use client';
export const dynamic = 'force-dynamic';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';

// Note: No GET /audit-logs endpoint exists in the current API.
// AuditService is write-only (used internally by content modules).
// When a dedicated read endpoint is added, replace this placeholder.

export default function AuditLogPage() {
  return (
    <AuthGuard>
      <AdminLayout breadcrumb="Audit Log">
        <h1 className="text-lg font-semibold mb-4">Audit Log</h1>
        <div className="bg-white border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">
            Audit log data is recorded internally. A read endpoint (<code className="text-xs bg-gray-100 px-1">GET /api/v1/audit-logs</code>) is not yet exposed by the API.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Publish actions, content changes, and media operations are all logged to the <code>AuditLog</code> table.
            Add a controller endpoint to surface them here.
          </p>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
