'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  size: number;
}

interface MediaLibraryProps {
  pickerMode?: false;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary(_props: MediaLibraryProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [draggingOver, setDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: MediaItem[] }>('/media');
      setItems((res.data as unknown as { data?: MediaItem[] }).data ?? (res.data as unknown as MediaItem[]));
    } catch {
      setError('Failed to load media');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const upload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      await load();
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void upload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void upload(file);
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.originalName}"?`)) return;
    try {
      await api.delete(`/media/${item.id}`);
      setItems(prev => prev.filter(m => m.id !== item.id));
      if (selected?.id === item.id) setSelected(null);
    } catch (err: unknown) {
      if ((err as { response?: { status?: number } })?.response?.status === 409) {
        setError('This media is in use by content items and cannot be deleted.');
      } else {
        setError('Delete failed');
      }
    }
  };

  const isImage = (mime: string) => mime.startsWith('image/');

  return (
    <div>
      {/* Upload zone */}
      <div
        className={`border-2 border-dashed p-6 text-center mb-4 transition-colors cursor-pointer ${
          draggingOver ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={e => { e.preventDefault(); setDraggingOver(true); }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload media — click or drag and drop"
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*,.pdf" />
        {uploading ? (
          <div>
            <div className="w-full bg-gray-200 h-2 mb-2">
              <div className="bg-primary h-2 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-sm text-gray-500">Uploading… {uploadProgress}%</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Drag &amp; drop or click to upload</p>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-4 gap-3 lg:grid-cols-6">
          {items.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(selected?.id === item.id ? null : item)}
              className={`group relative border text-left overflow-hidden ${
                selected?.id === item.id ? 'border-primary ring-1 ring-primary' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="aspect-square bg-gray-100 relative">
                {isImage(item.mimeType) ? (
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

      {/* Detail panel */}
      {selected && (
        <div className="mt-4 border border-gray-200 p-4 bg-white">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-sm font-medium truncate flex-1">{selected.originalName}</h3>
            <button
              type="button"
              onClick={() => { void handleDelete(selected); }}
              className="text-xs text-red-500 hover:underline ml-3 shrink-0"
            >
              Delete
            </button>
          </div>
          <dl className="text-xs space-y-1 text-gray-600">
            <div className="flex gap-2"><dt className="font-medium w-16">URL</dt><dd className="truncate flex-1">{selected.publicUrl}</dd></div>
            <div className="flex gap-2"><dt className="font-medium w-16">Type</dt><dd>{selected.mimeType}</dd></div>
            <div className="flex gap-2"><dt className="font-medium w-16">Size</dt><dd>{formatBytes(selected.size)}</dd></div>
            {selected.width && <div className="flex gap-2"><dt className="font-medium w-16">Dimensions</dt><dd>{selected.width}×{selected.height}</dd></div>}
            <div className="flex gap-2"><dt className="font-medium w-16">ID</dt><dd className="font-mono">{selected.id}</dd></div>
          </dl>
          <button
            type="button"
            onClick={() => { void navigator.clipboard.writeText(selected.id); }}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Copy ID
          </button>
        </div>
      )}
    </div>
  );
}
