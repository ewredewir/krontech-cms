'use client';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  HeroDataSchema,
  TextBlockDataSchema,
  CtaDataSchema,
  FeaturesGridDataSchema,
  FaqDataSchema,
  MediaBlockDataSchema,
  FormEmbedDataSchema,
  HeroSliderDataSchema,
  VideoDataSchema,
  StatsBannerDataSchema,
  WhyKronDataSchema,
  ContactSectionDataSchema,
  KuppingerColeDataSchema,
} from '@krontech/types';
import { createContext, useContext, useEffect, useState } from 'react';
import type { z } from 'zod';

interface ComponentBlockFormProps {
  type: string;
  initialData?: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void | Promise<void>;
  onCancel: () => void;
  saveLabel?: string;
}

const SaveLabelContext = createContext('Save');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LocaleFields({ base, register }: { base: string; register: UseFormRegister<any> }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium mb-1">TR</label>
        <input {...register(`${base}.tr`)} className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">EN</label>
        <input {...register(`${base}.en`)} className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
      </div>
    </div>
  );
}

function HeroForm({ initialData, onSave, onCancel }: Omit<ComponentBlockFormProps, 'type'>) {
  type F = z.infer<typeof HeroDataSchema>;
  const { register, handleSubmit } = useForm<F>({
    resolver: zodResolver(HeroDataSchema),
    defaultValues: initialData as F,
  });
  return (
    <form onSubmit={(e) => { void handleSubmit(d => onSave(d as Record<string, unknown>))(e); }} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Heading</label>
        <LocaleFields base="heading" register={register} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Subheading</label>
        <LocaleFields base="subheading" register={register} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">CTA Label</label>
        <LocaleFields base="ctaLabel" register={register} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">CTA URL</label>
        <input {...register('ctaUrl')} className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
      </div>
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function TextBlockForm({ initialData, onSave, onCancel }: Omit<ComponentBlockFormProps, 'type'>) {
  type F = z.infer<typeof TextBlockDataSchema>;
  const { register, handleSubmit } = useForm<F>({
    resolver: zodResolver(TextBlockDataSchema),
    defaultValues: initialData as F,
  });
  return (
    <form onSubmit={(e) => { void handleSubmit(d => onSave(d as Record<string, unknown>))(e); }} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Content TR</label>
        <textarea {...register('content.tr')} rows={5} className="w-full border px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-primary" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Content EN</label>
        <textarea {...register('content.en')} rows={5} className="w-full border px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-primary" />
      </div>
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function CtaForm({ initialData, onSave, onCancel }: Omit<ComponentBlockFormProps, 'type'>) {
  type F = z.infer<typeof CtaDataSchema>;
  const { register, handleSubmit } = useForm<F>({
    resolver: zodResolver(CtaDataSchema),
    defaultValues: initialData as F,
  });
  return (
    <form onSubmit={(e) => { void handleSubmit(d => onSave(d as Record<string, unknown>))(e); }} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Heading</label>
        <LocaleFields base="heading" register={register} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Button Label</label>
        <LocaleFields base="buttonLabel" register={register} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Button URL</label>
        <input {...register('buttonUrl')} className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
      </div>
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function FaqForm({ initialData, onSave, onCancel }: Omit<ComponentBlockFormProps, 'type'>) {
  type F = z.infer<typeof FaqDataSchema>;
  const { register, handleSubmit, watch, setValue } = useForm<F>({
    resolver: zodResolver(FaqDataSchema),
    defaultValues: (initialData as F) ?? { items: [{ question: { tr: '', en: '' }, answer: { tr: '', en: '' } }] },
  });
  const items = watch('items');
  return (
    <form onSubmit={(e) => { void handleSubmit(d => onSave(d as Record<string, unknown>))(e); }} className="space-y-4">
      {items.map((_, i) => (
        <div key={i} className="border border-gray-200 p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">FAQ #{i + 1}</span>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => setValue('items', items.filter((_, idx) => idx !== i))}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Question</label>
            <LocaleFields base={`items.${i}.question`} register={register} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Answer TR</label>
            <textarea {...register(`items.${i}.answer.tr`)} rows={2} className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Answer EN</label>
            <textarea {...register(`items.${i}.answer.en`)} rows={2} className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setValue('items', [...items, { question: { tr: '', en: '' }, answer: { tr: '', en: '' } }])}
        className="text-sm text-primary hover:underline"
      >
        + Add FAQ item
      </button>
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function FeaturesGridForm({ initialData, onSave, onCancel }: Omit<ComponentBlockFormProps, 'type'>) {
  type F = z.infer<typeof FeaturesGridDataSchema>;
  const { register, handleSubmit, watch, setValue } = useForm<F>({
    resolver: zodResolver(FeaturesGridDataSchema),
    defaultValues: (initialData as F) ?? { items: [{ icon: '', title: { tr: '', en: '' }, description: { tr: '', en: '' } }] },
  });
  const items = watch('items');
  return (
    <form onSubmit={(e) => { void handleSubmit(d => onSave(d as Record<string, unknown>))(e); }} className="space-y-4">
      {items.map((_, i) => (
        <div key={i} className="border border-gray-200 p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Feature #{i + 1}</span>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => setValue('items', items.filter((_, idx) => idx !== i))}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Icon (emoji or class name)</label>
            <input
              {...register(`items.${i}.icon`)}
              className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
              placeholder="e.g. 🔒 or shield-icon"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Title</label>
            <LocaleFields base={`items.${i}.title`} register={register} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Description TR</label>
            <textarea
              {...register(`items.${i}.description.tr`)}
              rows={2}
              className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Description EN</label>
            <textarea
              {...register(`items.${i}.description.en`)}
              rows={2}
              className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setValue('items', [...items, { icon: '', title: { tr: '', en: '' }, description: { tr: '', en: '' } }])}
        className="text-sm text-primary hover:underline"
      >
        + Add feature
      </button>
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function MediaBlockForm({ initialData, onSave, onCancel }: Omit<ComponentBlockFormProps, 'type'>) {
  type F = z.infer<typeof MediaBlockDataSchema>;
  const { register, handleSubmit } = useForm<F>({
    resolver: zodResolver(MediaBlockDataSchema),
    defaultValues: initialData as F,
  });
  return (
    <form onSubmit={(e) => { void handleSubmit(d => onSave(d as Record<string, unknown>))(e); }} className="space-y-3">
      <div>
        <label htmlFor="mediaId" className="block text-sm font-medium mb-1">Media ID (UUID)</label>
        <input id="mediaId" {...register('mediaId')} className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary font-mono" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Caption</label>
        <LocaleFields base="caption" register={register} />
      </div>
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function FormEmbedForm({ initialData, onSave, onCancel }: Omit<ComponentBlockFormProps, 'type'>) {
  type F = z.infer<typeof FormEmbedDataSchema>;
  const { register, handleSubmit } = useForm<F>({
    resolver: zodResolver(FormEmbedDataSchema),
    defaultValues: initialData as F,
  });
  return (
    <form onSubmit={(e) => { void handleSubmit(d => onSave(d as Record<string, unknown>))(e); }} className="space-y-3">
      <div>
        <label htmlFor="formId" className="block text-sm font-medium mb-1">Form ID (UUID)</label>
        <input id="formId" {...register('formId')} className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary font-mono" />
      </div>
      <FormActions onCancel={onCancel} />
    </form>
  );
}

// ─── New home-page block forms ────────────────────────────────────────────────

function HeroSliderForm({ initialData, onSave, onCancel }: Omit<ComponentBlockFormProps, 'type'>) {
  type F = z.infer<typeof HeroSliderDataSchema>;
  const { register, handleSubmit, watch, setValue } = useForm<F>({
    resolver: zodResolver(HeroSliderDataSchema),
    defaultValues: (initialData as F) ?? { slides: [{ heading: { tr: '', en: '' } }] },
  });
  const slides = watch('slides');
  return (
    <form onSubmit={(e) => { void handleSubmit(d => onSave(d as Record<string, unknown>))(e); }} className="space-y-4">
      {slides.map((_, i) => (
        <div key={i} className="border border-gray-200 p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Slide #{i + 1}</span>
            {slides.length > 1 && (
              <button type="button" onClick={() => setValue('slides', slides.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Heading (HTML allowed)</label>
            <LocaleFields base={`slides.${i}.heading`} register={register} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Subheading</label>
            <LocaleFields base={`slides.${i}.subheading`} register={register} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">CTA Label</label>
            <LocaleFields base={`slides.${i}.ctaLabel`} register={register} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">CTA URL</label>
            <input {...register(`slides.${i}.ctaUrl`)} className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Background Media ID (UUID)</label>
            <input {...register(`slides.${i}.backgroundMediaId`)} className="w-full border px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-primary" />
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setValue('slides', [...slides, { heading: { tr: '', en: '' } }])} className="text-sm text-primary hover:underline">
        + Add slide
      </button>
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function VideoForm({ initialData, onSave, onCancel }: Omit<ComponentBlockFormProps, 'type'>) {
  type F = z.infer<typeof VideoDataSchema>;
  const { register, handleSubmit, watch } = useForm<F>({
    resolver: zodResolver(VideoDataSchema),
    defaultValues: (initialData as F) ?? { videoId: '' },
  });
  const videoId = watch('videoId');
  return (
    <form onSubmit={(e) => { void handleSubmit(d => onSave(d as Record<string, unknown>))(e); }} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">YouTube Video ID</label>
        <input {...register('videoId')} className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary" placeholder="e.g. Ag2dQLxBzdE" />
        <p className="text-xs text-gray-400 mt-1">Enter only the ID portion, not the full URL.</p>
      </div>
      {videoId.length === 11 && (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Video preview"
            className="absolute inset-0 w-full h-full border border-gray-200"
            allowFullScreen
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Thumbnail Media ID (UUID)</label>
        <input {...register('thumbnailMediaId')} className="w-full border px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-primary" />
      </div>
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function StatsBannerForm({ initialData, onSave, onCancel }: Omit<ComponentBlockFormProps, 'type'>) {
  type F = z.infer<typeof StatsBannerDataSchema>;
  const { register, handleSubmit, watch, setValue } = useForm<F>({
    resolver: zodResolver(StatsBannerDataSchema),
    defaultValues: (initialData as F) ?? { stats: [{ label: { tr: '', en: '' }, value: '' }] },
  });
  const stats = watch('stats');
  return (
    <form onSubmit={(e) => { void handleSubmit(d => onSave(d as Record<string, unknown>))(e); }} className="space-y-4">
      {stats.map((_, i) => (
        <div key={i} className="border border-gray-200 p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Stat #{i + 1}</span>
            {stats.length > 1 && (
              <button type="button" onClick={() => setValue('stats', stats.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Label</label>
            <LocaleFields base={`stats.${i}.label`} register={register} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Value (e.g. 40+)</label>
            <input {...register(`stats.${i}.value`)} className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>
      ))}
      {stats.length < 8 && (
        <button type="button" onClick={() => setValue('stats', [...stats, { label: { tr: '', en: '' }, value: '' }])} className="text-sm text-primary hover:underline">
          + Add stat
        </button>
      )}
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function WhyKronForm({ initialData, onSave, onCancel }: Omit<ComponentBlockFormProps, 'type'>) {
  type F = z.infer<typeof WhyKronDataSchema>;
  const { register, handleSubmit, watch, setValue } = useForm<F>({
    resolver: zodResolver(WhyKronDataSchema),
    defaultValues: (initialData as F) ?? { items: [{ title: { tr: '', en: '' }, body: { tr: '', en: '' } }] },
  });
  const items = watch('items');
  return (
    <form onSubmit={(e) => { void handleSubmit(d => onSave(d as Record<string, unknown>))(e); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Section Heading (optional)</label>
        <LocaleFields base="heading" register={register} />
      </div>
      {items.map((_, i) => (
        <div key={i} className="border border-gray-200 p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Reason #{i + 1}</span>
            {items.length > 1 && (
              <button type="button" onClick={() => setValue('items', items.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Icon (emoji or name, optional)</label>
            <input {...register(`items.${i}.icon`)} className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary" placeholder="e.g. 🔒" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Title</label>
            <LocaleFields base={`items.${i}.title`} register={register} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Body TR</label>
            <textarea {...register(`items.${i}.body.tr`)} rows={2} className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Body EN</label>
            <textarea {...register(`items.${i}.body.en`)} rows={2} className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>
      ))}
      {items.length < 12 && (
        <button type="button" onClick={() => setValue('items', [...items, { title: { tr: '', en: '' }, body: { tr: '', en: '' } }])} className="text-sm text-primary hover:underline">
          + Add reason
        </button>
      )}
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function ContactSectionForm({ initialData, onSave, onCancel }: Omit<ComponentBlockFormProps, 'type'>) {
  type F = z.infer<typeof ContactSectionDataSchema>;
  const { register, handleSubmit } = useForm<F>({
    resolver: zodResolver(ContactSectionDataSchema),
    defaultValues: initialData as F,
  });
  const [forms, setForms] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    void fetch('/api/forms').then(r => r.json()).then((d: unknown) => {
      const arr = Array.isArray(d) ? d : (d as { data?: unknown[] }).data ?? [];
      setForms(arr as Array<{ id: string; name: string }>);
    }).catch(() => { /* ignore */ });
  }, []);
  return (
    <form onSubmit={(e) => { void handleSubmit(d => onSave(d as Record<string, unknown>))(e); }} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Background Media ID (UUID)</label>
        <input {...register('backgroundMediaId')} className="w-full border px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-primary" />
      </div>
      <div>
        <label htmlFor="csFormId" className="block text-sm font-medium mb-1">Form</label>
        {forms.length > 0 ? (
          <select id="csFormId" {...register('formId')} className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary">
            <option value="">— select a form —</option>
            {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        ) : (
          <input id="csFormId" {...register('formId')} className="w-full border px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-primary" placeholder="Form UUID" />
        )}
      </div>
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function KuppingerColeForm({ initialData, onSave, onCancel }: Omit<ComponentBlockFormProps, 'type'>) {
  type F = z.infer<typeof KuppingerColeDataSchema>;
  const { register, handleSubmit } = useForm<F>({
    resolver: zodResolver(KuppingerColeDataSchema),
    defaultValues: initialData as F,
  });
  return (
    <form onSubmit={(e) => { void handleSubmit(d => onSave(d as Record<string, unknown>))(e); }} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Heading (optional)</label>
        <LocaleFields base="heading" register={register} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Link URL (optional)</label>
        <input {...register('linkHref')} className="w-full border px-2 py-1.5 text-sm focus:outline-none focus:border-primary" placeholder="https://…" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Badge Media ID (UUID)</label>
        <input {...register('badgeMediaId')} className="w-full border px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-primary" />
      </div>
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function NoConfigForm({ label }: { label: string }) {
  return (
    <div className="text-sm text-gray-500 py-4 px-2 bg-gray-50 border border-dashed border-gray-300">
      {label}
    </div>
  );
}

function FormActions({ onCancel }: { onCancel: () => void }) {
  const saveLabel = useContext(SaveLabelContext);
  return (
    <div className="flex gap-2 pt-1">
      <button type="submit" className="bg-primary text-white px-3 py-1.5 text-sm hover:bg-blue-700">{saveLabel}</button>
      <button type="button" onClick={onCancel} className="border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">Cancel</button>
    </div>
  );
}

export function ComponentBlockForm({ type, initialData, onSave, onCancel, saveLabel = 'Save' }: ComponentBlockFormProps) {
  // Inject the discriminator field required by PageComponentDataSchema before persisting.
  const wrappedOnSave = (data: Record<string, unknown>) =>
    onSave({ ...data, __type: type });

  const props = { initialData, onSave: wrappedOnSave, onCancel };

  const form = (() => { switch (type) {
    case 'hero': return <HeroForm {...props} />;
    case 'text_block': return <TextBlockForm {...props} />;
    case 'cta': return <CtaForm {...props} />;
    case 'features_grid': return <FeaturesGridForm {...props} />;
    case 'faq': return <FaqForm {...props} />;
    case 'media_block': return <MediaBlockForm {...props} />;
    case 'form_embed': return <FormEmbedForm {...props} />;
    case 'hero_slider': return <HeroSliderForm {...props} />;
    case 'video': return <VideoForm {...props} />;
    case 'stats_banner': return <StatsBannerForm {...props} />;
    case 'why_kron': return <WhyKronForm {...props} />;
    case 'contact_section': return <ContactSectionForm {...props} />;
    case 'kuppinger_cole': return <KuppingerColeForm {...props} />;
    case 'product_catalog': return <NoConfigForm label="This section automatically displays all published products. No configuration needed." />;
    case 'blog_carousel': return <NoConfigForm label="This section automatically displays the latest blog posts. No configuration needed." />;
    default: return (
      <div className="text-sm text-gray-500 py-4">
        No editor available for component type: <code>{type}</code>
      </div>
    );
  } })();

  return <SaveLabelContext.Provider value={saveLabel}>{form}</SaveLabelContext.Provider>;
}
