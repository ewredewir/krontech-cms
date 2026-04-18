'use client';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import api from '@/lib/api';

interface MediaItem {
  id: string;
  publicUrl: string;
  originalName: string;
  mimeType: string;
  altText: { tr: string; en: string };
  blurDataUrl: string | null;
  width: number | null;
  height: number | null;
}

interface MediaPickerProps {
  open: boolean;
  onSelect: (media: MediaItem) => void;
  onClose: () => void;
}

export function MediaPicker({ open, onSelect, onClose }: MediaPickerProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown>('/media');
      const data = (res.data as { data?: MediaItem[] }).data ?? (res.data as MediaItem[]);
      setItems(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  if (!open) return null;

  const filtered = search
    ? items.filter(m => m.originalName.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Select media"
    >
      <div className="bg-white w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold">Select Media</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close media picker"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-4 py-2 border-b border-gray-200">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by filename…"
            className="w-full border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No media found</p>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {filtered.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onSelect(item); onClose(); }}
                  className="border border-gray-200 hover:border-primary text-left overflow-hidden transition-colors"
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {item.mimeType.startsWith('image/') ? (
                      <Image
                        src={item.publicUrl}
                        alt={item.altText?.tr ?? item.originalName}
                        fill
                        className="object-cover"
                        sizes="150px"
                        placeholder={item.blurDataUrl ? 'blur' : 'empty'}
                        blurDataURL={item.blurDataUrl ?? undefined}
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        {item.mimeType.split('/')[1]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 px-1.5 py-1 truncate">{item.originalName}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
