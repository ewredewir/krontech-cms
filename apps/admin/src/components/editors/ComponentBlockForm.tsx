'use client';
import { useForm, type UseFormRegister, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  HeroDataSchema,
  TextBlockDataSchema,
  CtaDataSchema,
  FeaturesGridDataSchema,
  FaqDataSchema,
  MediaBlockDataSchema,
  FormEmbedDataSchema,
} from '@krontech/types';
import type { z } from 'zod';

interface ComponentBlockFormProps {
  type: string;
  initialData?: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void | Promise<void>;
  onCancel: () => void;
}

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

function FormActions({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex gap-2 pt-1">
      <button type="submit" className="bg-primary text-white px-3 py-1.5 text-sm hover:bg-blue-700">Save</button>
      <button type="button" onClick={onCancel} className="border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">Cancel</button>
    </div>
  );
}

export function ComponentBlockForm({ type, initialData, onSave, onCancel }: ComponentBlockFormProps) {
  const props = { initialData, onSave, onCancel };

  switch (type) {
    case 'hero': return <HeroForm {...props} />;
    case 'text_block': return <TextBlockForm {...props} />;
    case 'cta': return <CtaForm {...props} />;
    case 'features_grid': return <FeaturesGridForm {...props} />;
    case 'faq': return <FaqForm {...props} />;
    case 'media_block': return <MediaBlockForm {...props} />;
    case 'form_embed': return <FormEmbedForm {...props} />;
    default: return (
      <div className="text-sm text-gray-500 py-4">
        No editor available for component type: <code>{type}</code>
      </div>
    );
  }
}
