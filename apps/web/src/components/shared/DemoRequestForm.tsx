'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n';

interface ProductOption {
  id: string;
  slug: { tr: string; en: string };
  name: { tr: string; en: string };
}

const schema = z.object({
  company: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  productInterest: z.string().min(1),
  message: z.string().optional(),
  kvkk: z.boolean().refine((v) => v, { message: 'required' }),
});

type FormValues = z.infer<typeof schema>;

interface DemoRequestFormProps {
  locale: Locale;
}

export function DemoRequestForm({ locale }: DemoRequestFormProps) {
  const t = useTranslations('demo');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/public/products/${locale}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProductOptions(data as ProductOption[]);
      })
      .catch(() => setProductOptions([]));
  }, [locale]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    setSubmitError(null);

    const { kvkk, ...fieldData } = data;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/public/forms/demo/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: fieldData,
            consentGiven: kvkk === true,
            _honeypot: '',
          }),
        },
      );

      if (!res.ok) {
        throw new Error(`Submission failed: ${res.status}`);
      }

      setSuccess(true);
    } catch {
      setSubmitError(locale === 'tr' ? 'Bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'border border-gray-200 h-[46px] px-4 w-full text-sm outline-none focus:border-primary bg-white text-heading';
  const labelClass = 'text-secondary-text text-xs mb-1 block';
  const errorClass = 'text-error text-xs mt-1';

  if (success) {
    return (
      <div className="p-6 text-center">
        <p className="text-success text-lg font-medium">{t('successMessage')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 nav:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dr-company" className={labelClass}>{t('company')} *</label>
          <input id="dr-company" type="text" {...register('company')} className={inputClass} placeholder={t('company')} />
          {errors.company && <p className={errorClass} role="alert">{errors.company.message}</p>}
        </div>
        <div>
          <label htmlFor="dr-name" className={labelClass}>{t('name')} *</label>
          <input id="dr-name" type="text" {...register('name')} className={inputClass} placeholder={t('name')} />
          {errors.name && <p className={errorClass} role="alert">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="dr-email" className={labelClass}>{t('email')} *</label>
          <input id="dr-email" type="email" {...register('email')} className={inputClass} placeholder={t('email')} />
          {errors.email && <p className={errorClass} role="alert">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="dr-phone" className={labelClass}>{t('phone')}</label>
          <input id="dr-phone" type="tel" {...register('phone')} className={inputClass} placeholder={t('phone')} />
        </div>
        <div className="nav:col-span-2">
          <label htmlFor="dr-product" className={labelClass}>{t('productInterest')} *</label>
          <select id="dr-product" {...register('productInterest')} className={inputClass}>
            <option value="">{t('selectProduct')}</option>
            {productOptions.map((p) => (
              <option key={p.id} value={p.slug[locale]}>{p.name[locale]}</option>
            ))}
          </select>
          {errors.productInterest && <p className={errorClass} role="alert">{errors.productInterest.message}</p>}
        </div>
        <div className="nav:col-span-2">
          <label htmlFor="dr-message" className={labelClass}>{t('message')}</label>
          <textarea
            id="dr-message"
            rows={4}
            {...register('message')}
            className="border border-gray-200 px-4 py-3 w-full text-sm outline-none focus:border-primary bg-white text-heading"
            placeholder={t('message')}
          />
        </div>
        <div className="nav:col-span-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" {...register('kvkk')} className="mt-1 accent-primary" />
            <span className="text-secondary-text text-xs">{t('kvkk')}</span>
          </label>
          {errors.kvkk && <p className={errorClass} role="alert">{errors.kvkk.message}</p>}
        </div>
      </div>
      {submitError && (
        <p role="alert" className="text-error text-sm mt-4">{submitError}</p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="mt-6 bg-primary hover:bg-primary-light disabled:opacity-60 text-white font-medium px-10 py-3 text-sm transition-colors"
      >
        {submitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
