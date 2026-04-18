'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateSeoMetaSchema } from '@krontech/types';
import type { z } from 'zod';
import { useState } from 'react';
import api from '@/lib/api';

type SeoMetaFormValues = z.infer<typeof UpdateSeoMetaSchema>;

interface SeoMetaPanelProps {
  entityType: 'page' | 'blog' | 'product';
  entityId: string;
  locale: 'tr' | 'en';
  initialData?: Partial<SeoMetaFormValues>;
  onSaved?: () => void;
}

const ENTITY_PATH: Record<SeoMetaPanelProps['entityType'], string> = {
  page: 'pages',
  blog: 'blog/posts',
  product: 'products',
};

export function SeoMetaPanel({ entityType, entityId, locale, initialData, onSaved }: SeoMetaPanelProps) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const { register, watch, handleSubmit, formState: { errors } } = useForm<SeoMetaFormValues>({
    resolver: zodResolver(UpdateSeoMetaSchema),
    defaultValues: {
      robots: 'index, follow',
      ...initialData,
    },
  });

  const metaTitle = watch(`metaTitle.${locale}`) ?? '';
  const metaDescription = watch(`metaDescription.${locale}`) ?? '';

  const titleCount = metaTitle.length;
  const descCount = metaDescription.length;
  const titleStatus = titleCount === 0 ? 'empty' : titleCount < 50 ? 'short' : titleCount > 60 ? 'long' : 'good';
  const descStatus = descCount === 0 ? 'empty' : descCount < 120 ? 'short' : descCount > 160 ? 'long' : 'good';

  const countColor = (status: string) =>
    status === 'good' ? 'text-green-600' : status === 'long' ? 'text-red-500' : 'text-orange-500';

  const onSubmit = async (data: SeoMetaFormValues) => {
    setSaving(true);
    setSaveError('');
    try {
      await api.put(`/${ENTITY_PATH[entityType]}/${entityId}/seo`, data);
      onSaved?.();
    } catch {
      setSaveError('Failed to save SEO data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <details className="border border-gray-200">
      <summary className="px-4 py-3 cursor-pointer font-medium text-sm bg-gray-50 select-none">
        SEO &amp; Structured Data
      </summary>
      <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="p-4 space-y-4">
        {/* Meta title */}
        <div>
          <label htmlFor={`metaTitle-${locale}`} className="block text-sm font-medium mb-1">
            Meta Title ({locale.toUpperCase()})
            <span className={`ml-2 text-xs ${countColor(titleStatus)}`}>
              {titleCount}/60
            </span>
          </label>
          <input
            id={`metaTitle-${locale}`}
            {...register(`metaTitle.${locale}`)}
            className="w-full border px-3 py-2 text-sm focus:outline-none focus:border-primary"
            placeholder={`Meta title in ${locale}`}
          />
          {errors.metaTitle && (
            <p className="text-red-500 text-xs mt-1">{String(errors.metaTitle)}</p>
          )}
        </div>

        {/* Meta description */}
        <div>
          <label htmlFor={`metaDesc-${locale}`} className="block text-sm font-medium mb-1">
            Meta Description ({locale.toUpperCase()})
            <span className={`ml-2 text-xs ${countColor(descStatus)}`}>
              {descCount}/160
            </span>
          </label>
          <textarea
            id={`metaDesc-${locale}`}
            {...register(`metaDescription.${locale}`)}
            rows={3}
            className="w-full border px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {/* Google SERP preview */}
        <div className="bg-white border p-3">
          <p className="text-xs text-gray-500 mb-2">Google SERP Preview</p>
          <div className="font-medium text-blue-700 text-base truncate">
            {metaTitle || 'Page Title | Krontech'}
          </div>
          <div className="text-green-700 text-xs">
            https://krontech.com/{locale}/...
          </div>
          <div className="text-gray-600 text-sm mt-1 line-clamp-2">
            {metaDescription || 'Meta description will appear here'}
          </div>
        </div>

        {/* Canonical */}
        <div>
          <label htmlFor="canonical" className="block text-sm font-medium mb-1">Canonical URL (optional)</label>
          <input
            id="canonical"
            {...register('canonical')}
            className="w-full border px-3 py-2 text-sm focus:outline-none focus:border-primary"
            placeholder="https://krontech.com/..."
          />
        </div>

        {/* Robots */}
        <div>
          <label htmlFor="robots" className="block text-sm font-medium mb-1">Robots</label>
          <select
            id="robots"
            {...register('robots')}
            className="w-full border px-3 py-2 text-sm focus:outline-none focus:border-primary"
          >
            <option value="index, follow">index, follow</option>
            <option value="noindex, follow">noindex, follow</option>
            <option value="index, nofollow">index, nofollow</option>
            <option value="noindex, nofollow">noindex, nofollow</option>
          </select>
        </div>

        {/* JSON-LD type */}
        <div>
          <label htmlFor="jsonLdType" className="block text-sm font-medium mb-1">JSON-LD Type</label>
          <select
            id="jsonLdType"
            {...register('jsonLdType')}
            className="w-full border px-3 py-2 text-sm focus:outline-none focus:border-primary"
          >
            <option value="">Auto (based on content type)</option>
            <option value="Article">Article</option>
            <option value="FAQPage">FAQPage</option>
            <option value="SoftwareApplication">SoftwareApplication</option>
            <option value="Product">Product</option>
          </select>
        </div>

        {saveError && <p className="text-red-500 text-xs">{saveError}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save SEO'}
        </button>
      </form>
    </details>
  );
}
