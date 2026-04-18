export const dynamic = 'force-dynamic';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { MediaLibrary } from '@/components/media/MediaLibrary';

export default function MediaPage() {
  return (
    <AuthGuard>
      <AdminLayout breadcrumb="Media">
        <h1 className="text-lg font-semibold mb-4">Media Library</h1>
        <MediaLibrary />
      </AdminLayout>
    </AuthGuard>
  );
}
