'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Turnstile } from '@marsidev/react-turnstile';
import type { Locale } from '@/lib/i18n';

const COUNTRIES = [
  { code: 'TR', name: { tr: 'Türkiye', en: 'Turkey' } },
  { code: 'US', name: { tr: 'Amerika Birleşik Devletleri', en: 'United States' } },
  { code: 'GB', name: { tr: 'Birleşik Krallık', en: 'United Kingdom' } },
  { code: 'DE', name: { tr: 'Almanya', en: 'Germany' } },
  { code: 'FR', name: { tr: 'Fransa', en: 'France' } },
  { code: 'NL', name: { tr: 'Hollanda', en: 'Netherlands' } },
  { code: 'AE', name: { tr: 'Birleşik Arap Emirlikleri', en: 'United Arab Emirates' } },
  { code: 'SA', name: { tr: 'Suudi Arabistan', en: 'Saudi Arabia' } },
  { code: 'OTHER', name: { tr: 'Diğer', en: 'Other' } },
];

interface Product {
  id: string;
  slug: { tr: string; en: string };
  name: { tr: string; en: string };
}

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().min(1),
  jobTitle: z.string().min(1),
  email: z.string().email(),
  product: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().optional(),
  callbackPreference: z.string().optional(),
  subject: z.string().min(1),
  message: z.string().min(1),
  kvkk1: z.boolean().refine((v) => v, { message: 'required' }),
  kvkk2: z.boolean().optional(),
  _honeypot: z.string().max(0).optional(),
});

type FormValues = z.infer<typeof schema>;

interface DemoRequestFormProps {
  locale: Locale;
}

export function DemoRequestForm({ locale }: DemoRequestFormProps) {
  const t = useTranslations('demo');
  const [products, setProducts] = useState<Product[]>([]);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/public/products/${locale}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setProducts(data as Product[]);
      })
      .catch(() => setProducts([]));
  }, [locale]);

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    setSubmitError(null);

    const { kvkk1, _honeypot, ...fieldData } = data;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/public/forms/demo/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: fieldData,
            consentGiven: kvkk1 === true,
            _honeypot: _honeypot ?? '',
            turnstileToken,
          }),
        },
      );

      if (!res.ok) throw new Error(`${res.status}`);
      setSuccess(true);
    } catch {
      setSubmitError(t('errorMessage'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'border border-gray-200 h-[46px] px-4 w-full text-sm outline-none focus:border-primary bg-white text-heading';
  const selectClass = 'border border-gray-200 h-[46px] px-4 w-full text-sm outline-none focus:border-primary bg-white text-heading appearance-none';
  const labelClass = 'text-secondary-text text-xs mb-1 block';
  const errorClass = 'text-red-500 text-xs mt-1';

  if (success) {
    return (
      <div className="py-10 text-center">
        <p className="text-lg font-medium text-heading">{t('successMessage')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label={t('sectionLabel')}>
      {/* Honeypot */}
      <input type="text" {...register('_honeypot')} className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid grid-cols-1 nav:grid-cols-2 gap-4">
        {/* Row 1: First Name / Last Name */}
        <div>
          <label htmlFor="dr-firstName" className={labelClass}>{t('firstName')} *</label>
          <input id="dr-firstName" type="text" {...register('firstName')} className={inputClass} placeholder={t('firstName')} />
          {errors.firstName && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>
        <div>
          <label htmlFor="dr-lastName" className={labelClass}>{t('lastName')} *</label>
          <input id="dr-lastName" type="text" {...register('lastName')} className={inputClass} placeholder={t('lastName')} />
          {errors.lastName && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>

        {/* Row 2: Company / Job Title */}
        <div>
          <label htmlFor="dr-company" className={labelClass}>{t('company')} *</label>
          <input id="dr-company" type="text" {...register('company')} className={inputClass} placeholder={t('company')} />
          {errors.company && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>
        <div>
          <label htmlFor="dr-jobTitle" className={labelClass}>{t('jobTitle')} *</label>
          <input id="dr-jobTitle" type="text" {...register('jobTitle')} className={inputClass} placeholder={t('jobTitle')} />
          {errors.jobTitle && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>

        {/* Row 3: Email / Product */}
        <div>
          <label htmlFor="dr-email" className={labelClass}>{t('email')} *</label>
          <input id="dr-email" type="email" {...register('email')} className={inputClass} placeholder={t('email')} />
          {errors.email && <p className={errorClass} role="alert">{t('invalidEmail')}</p>}
        </div>
        <div>
          <label htmlFor="dr-product" className={labelClass}>{t('product')} *</label>
          <div className="relative">
            <select id="dr-product" {...register('product')} className={selectClass}>
              <option value="">{t('selectProduct')}</option>
              {products.map((p) => (
                <option key={p.id} value={p.slug[locale]}>{p.name[locale]}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">▾</span>
          </div>
          {errors.product && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>

        {/* Row 4: Country / Phone */}
        <div>
          <label htmlFor="dr-country" className={labelClass}>{t('country')} *</label>
          <div className="relative">
            <select id="dr-country" {...register('country')} className={selectClass}>
              <option value="">{t('selectCountry')}</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name[locale]}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">▾</span>
          </div>
          {errors.country && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>
        <div>
          <label htmlFor="dr-phone" className={labelClass}>{t('phone')}</label>
          <input id="dr-phone" type="tel" {...register('phone')} className={inputClass} placeholder={t('phone')} />
        </div>

        {/* Row 5: Callback preference — full width */}
        <div className="nav:col-span-2">
          <label htmlFor="dr-callback" className={labelClass}>{t('callbackPreference')}</label>
          <div className="relative">
            <select id="dr-callback" {...register('callbackPreference')} className={selectClass}>
              <option value="">{t('callbackSelect')}</option>
              <option value="yes">{t('callbackYes')}</option>
              <option value="no">{t('callbackNo')}</option>
              <option value="not_needed">{t('callbackNotNeeded')}</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">▾</span>
          </div>
        </div>

        {/* Row 6: Subject — full width */}
        <div className="nav:col-span-2">
          <label htmlFor="dr-subject" className={labelClass}>{t('subject')} *</label>
          <input id="dr-subject" type="text" {...register('subject')} className={inputClass} placeholder={t('subject')} />
          {errors.subject && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>

        {/* Row 7: Message — full width */}
        <div className="nav:col-span-2">
          <label htmlFor="dr-message" className={labelClass}>{t('message')} *</label>
          <textarea
            id="dr-message"
            rows={4}
            {...register('message')}
            className="border border-gray-200 px-4 py-3 w-full text-sm outline-none focus:border-primary bg-white text-heading"
            placeholder={t('message')}
          />
          {errors.message && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>

        {/* Row 8: KVKK + Turnstile */}
        <div className="nav:col-span-2 grid nav:grid-cols-2 gap-4 items-start">
          <div className="space-y-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" {...register('kvkk1')} className="mt-1 accent-primary flex-shrink-0" />
              <span className="text-secondary-text text-xs leading-relaxed">{t('kvkk1')}</span>
            </label>
            {errors.kvkk1 && <p className={errorClass} role="alert">{t('required')}</p>}
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" {...register('kvkk2')} className="mt-1 accent-primary flex-shrink-0" />
              <span className="text-secondary-text text-xs leading-relaxed">{t('kvkk2')}</span>
            </label>
          </div>
          <div className="flex flex-col items-start gap-3">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
              onSuccess={setTurnstileToken}
              onExpire={() => setTurnstileToken(undefined)}
              options={{ appearance: 'always', theme: 'light' }}
            />
            <button
              type="submit"
              disabled={submitting || !turnstileToken}
              className="w-full bg-primary hover:bg-primary-light disabled:opacity-60 text-white font-medium px-10 py-3 text-sm transition-colors"
            >
              {submitting ? t('submitting') : t('submit')}
            </button>
          </div>
        </div>
      </div>

      {submitError && (
        <p role="alert" className="text-red-500 text-sm mt-4">{submitError}</p>
      )}
    </form>
  );
}
