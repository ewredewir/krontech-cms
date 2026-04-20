'use client';

import { useSearchParams } from 'next/navigation';

export function PreviewBanner() {
  const params = useSearchParams();
  if (params.get('preview') !== '1') return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-amber-400 text-amber-900 text-xs font-semibold text-center py-2 shadow-lg">
      PREVIEW MODE — This page reflects unpublished content
    </div>
  );
}
