import { draftMode } from 'next/headers';

export function PreviewBanner() {
  const { isEnabled } = draftMode();
  if (!isEnabled) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-amber-400 text-amber-900 text-xs font-semibold text-center py-2 shadow-lg">
      PREVIEW MODE —{' '}
      <a href="/api/preview/disable" className="underline hover:text-amber-700">
        Exit Preview
      </a>
    </div>
  );
}
