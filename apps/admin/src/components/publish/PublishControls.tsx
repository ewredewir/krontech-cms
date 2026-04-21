'use client';
import { useState } from 'react';
import api from '@/lib/api';

interface PublishControlsProps {
  entityType: 'page' | 'blog' | 'product';
  entityId: string;
  currentStatus: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  scheduledAt?: string;
  hasPendingDrafts?: boolean;
  onStatusChange: () => void;
}

// API-confirmed paths (verified from controller source):
// POST /pages/:id/publish          POST /blog/posts/:id/publish          POST /products/:id/publish
// POST /pages/:id/unpublish        POST /blog/posts/:id/unpublish        POST /products/:id/unpublish
// POST /pages/:id/schedule         POST /blog/posts/:id/schedule         POST /products/:id/schedule
// POST /pages/:id/cancel-schedule  POST /blog/posts/:id/cancel-schedule  POST /products/:id/cancel-schedule
// GET  /pages/:id/preview-link     (pages only — blog/products have no preview-link endpoint)

const BASE: Record<PublishControlsProps['entityType'], string> = {
  page: 'pages',
  blog: 'blog/posts',
  product: 'products',
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-green-100 text-green-700',
  SCHEDULED: 'bg-yellow-100 text-yellow-700',
};

export function PublishControls({
  entityType,
  entityId,
  currentStatus,
  scheduledAt,
  hasPendingDrafts = false,
  onStatusChange,
}: PublishControlsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scheduleDate, setScheduleDate] = useState(scheduledAt ?? '');
  const [showScheduler, setShowScheduler] = useState(false);

  const base = BASE[entityType];

  const call = async (action: () => Promise<unknown>) => {
    setLoading(true);
    setError('');
    try {
      await action();
      onStatusChange();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Action failed — please try again');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = () => call(() => api.post(`/${base}/${entityId}/publish`));
  const handleUnpublish = () => call(() => api.post(`/${base}/${entityId}/unpublish`));
  const handleCancelSchedule = () => call(() => api.post(`/${base}/${entityId}/cancel-schedule`));

  const handleSchedule = () =>
    call(() => {
      if (!scheduleDate) throw new Error('scheduledAt required');
      return api.post(`/${base}/${entityId}/schedule`, {
        scheduledAt: new Date(scheduleDate).toISOString(),
      });
    });

  const handlePreviewLink = async () => {
    try {
      const res = await api.get<{ url: string }>(`/${base}/${entityId}/preview-link`);
      window.open(res.data.url, '_blank', 'noopener');
    } catch {
      setError('Could not generate preview link');
    }
  };

  return (
    <div className="border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Status</span>
        <span className={`text-xs font-medium px-2 py-0.5 ${STATUS_BADGE[currentStatus]}`}>
          {currentStatus}
        </span>
      </div>

      {currentStatus === 'SCHEDULED' && scheduledAt && (
        <p className="text-xs text-gray-500">
          Scheduled for {new Date(scheduledAt).toLocaleString()}
        </p>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex flex-col gap-2">
        {/* Publish Now — available from DRAFT or SCHEDULED */}
        {(currentStatus === 'DRAFT' || currentStatus === 'SCHEDULED') && (
          <button
            type="button"
            onClick={() => { void handlePublish(); }}
            disabled={loading}
            className="w-full bg-green-600 text-white py-1.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Publish Now
          </button>
        )}

        {/* Publish Changes — PUBLISHED with pending drafts only */}
        {currentStatus === 'PUBLISHED' && hasPendingDrafts && (
          <button
            type="button"
            onClick={() => { void handlePublish(); }}
            disabled={loading}
            className="w-full bg-green-600 text-white py-1.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Publish Changes
          </button>
        )}

        {/* Schedule — available from DRAFT only */}
        {currentStatus === 'DRAFT' && (
          <div>
            <button
              type="button"
              onClick={() => setShowScheduler(v => !v)}
              className="w-full border border-gray-300 py-1.5 text-sm hover:bg-gray-50"
            >
              {showScheduler ? 'Cancel Scheduling' : 'Schedule…'}
            </button>
            {showScheduler && (
              <div className="mt-2 flex gap-2">
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  className="flex-1 border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => { void handleSchedule(); }}
                  disabled={loading || !scheduleDate}
                  className="bg-primary text-white px-3 py-1 text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Set
                </button>
              </div>
            )}
          </div>
        )}

        {/* Cancel Schedule — SCHEDULED only */}
        {currentStatus === 'SCHEDULED' && (
          <button
            type="button"
            onClick={() => { void handleCancelSchedule(); }}
            disabled={loading}
            className="w-full border border-yellow-400 text-yellow-700 py-1.5 text-sm hover:bg-yellow-50 disabled:opacity-50"
          >
            Cancel Schedule
          </button>
        )}

        {/* Unpublish — PUBLISHED only */}
        {currentStatus === 'PUBLISHED' && (
          <button
            type="button"
            onClick={() => { void handleUnpublish(); }}
            disabled={loading}
            className="w-full border border-red-300 text-red-600 py-1.5 text-sm hover:bg-red-50 disabled:opacity-50"
          >
            Unpublish
          </button>
        )}

        {/* Preview link — pages only (no endpoint on blog/products) */}
        {entityType === 'page' && (
          <button
            type="button"
            onClick={() => { void handlePreviewLink(); }}
            className="w-full border border-gray-300 py-1.5 text-sm hover:bg-gray-50"
          >
            Generate Preview Link
          </button>
        )}
      </div>
    </div>
  );
}
