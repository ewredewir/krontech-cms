'use client';

import { useState } from 'react';
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

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  title: z.string().optional(),
  department: z.string().min(1),
  company: z.string().min(1),
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

interface ContactFormProps {
  locale: Locale;
  dark?: boolean;
}

export function ContactForm({ locale, dark }: ContactFormProps) {
  const t = useTranslations('contact');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    setSubmitError(null);

    const { kvkk1, _honeypot, ...fieldData } = data;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/public/forms/contact/submit`,
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

      if (!res.ok) {
        throw new Error(`Submission failed: ${res.status}`);
      }

      setSuccess(true);
    } catch {
      setSubmitError(locale === 'tr' ? t('errorMessage') : t('errorMessage'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = dark
    ? 'bg-transparent border border-white/40 text-white placeholder:text-white/60 h-[46px] px-4 w-full text-sm outline-none focus:border-primary'
    : 'border border-gray-200 h-[46px] px-4 w-full text-sm outline-none focus:border-primary bg-white text-heading';

  const selectClass = dark
    ? 'bg-transparent border border-white/40 text-white h-[46px] px-4 w-full text-sm outline-none focus:border-primary appearance-none'
    : 'border border-gray-200 h-[46px] px-4 w-full text-sm outline-none focus:border-primary bg-white text-heading appearance-none';

  const labelClass = dark ? 'text-white/80 text-xs mb-1 block' : 'text-secondary-text text-xs mb-1 block';
  const errorClass = 'text-red-400 text-xs mt-1';

  if (success) {
    return (
      <div className={`py-10 text-center ${dark ? 'text-white' : 'text-heading'}`}>
        <p className="text-lg font-medium">{t('successMessage')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label={t('sectionLabel')}>
      {/* Honeypot — hidden from real users */}
      <input type="text" {...register('_honeypot')} className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid grid-cols-1 nav:grid-cols-2 gap-4">
        {/* Row 1: First name / Last name */}
        <div>
          <label htmlFor="cf-firstName" className={labelClass}>{t('firstName')} *</label>
          <input id="cf-firstName" type="text" {...register('firstName')} className={inputClass} placeholder={t('firstName')} />
          {errors.firstName && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>
        <div>
          <label htmlFor="cf-lastName" className={labelClass}>{t('lastName')} *</label>
          <input id="cf-lastName" type="text" {...register('lastName')} className={inputClass} placeholder={t('lastName')} />
          {errors.lastName && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>

        {/* Row 2: Email / Title */}
        <div>
          <label htmlFor="cf-email" className={labelClass}>{t('email')} *</label>
          <input id="cf-email" type="email" {...register('email')} className={inputClass} placeholder={t('email')} />
          {errors.email && <p className={errorClass} role="alert">{t('invalidEmail')}</p>}
        </div>
        <div>
          <label htmlFor="cf-title" className={labelClass}>{t('title')}</label>
          <input id="cf-title" type="text" {...register('title')} className={inputClass} placeholder={t('title')} />
        </div>

        {/* Row 3: Department / Company */}
        <div>
          <label htmlFor="cf-department" className={labelClass}>{t('department')} *</label>
          <div className="relative">
            <select id="cf-department" {...register('department')} className={selectClass}>
              <option value="">{t('selectDepartment')}</option>
              <option value="it">{t('deptIT')}</option>
              <option value="security">{t('deptSecurity')}</option>
              <option value="management">{t('deptManagement')}</option>
              <option value="other">{t('deptOther')}</option>
            </select>
            <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${dark ? 'text-white/60' : 'text-gray-400'}`}>▾</span>
          </div>
          {errors.department && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>
        <div>
          <label htmlFor="cf-company" className={labelClass}>{t('company')} *</label>
          <input id="cf-company" type="text" {...register('company')} className={inputClass} placeholder={t('company')} />
          {errors.company && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>

        {/* Row 4: Country / Phone */}
        <div>
          <label htmlFor="cf-country" className={labelClass}>{t('country')} *</label>
          <div className="relative">
            <select id="cf-country" {...register('country')} className={selectClass}>
              <option value="">{t('selectCountry')}</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name[locale]}</option>
              ))}
            </select>
            <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${dark ? 'text-white/60' : 'text-gray-400'}`}>▾</span>
          </div>
          {errors.country && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>
        <div>
          <label htmlFor="cf-phone" className={labelClass}>{t('phone')}</label>
          <input id="cf-phone" type="tel" {...register('phone')} className={inputClass} placeholder={t('phone')} />
        </div>

        {/* Row 5: Callback preference — full width */}
        <div className="nav:col-span-2">
          <label htmlFor="cf-callback" className={labelClass}>{t('callbackPreference')}</label>
          <div className="relative">
            <select id="cf-callback" {...register('callbackPreference')} className={selectClass}>
              <option value="">{t('callbackSelect')}</option>
              <option value="yes">{t('callbackYes')}</option>
              <option value="no">{t('callbackNo')}</option>
              <option value="not_needed">{t('callbackNotNeeded')}</option>
            </select>
            <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${dark ? 'text-white/60' : 'text-gray-400'}`}>▾</span>
          </div>
        </div>

        {/* Row 6: Subject — full width */}
        <div className="nav:col-span-2">
          <label htmlFor="cf-subject" className={labelClass}>{t('subject')} *</label>
          <input id="cf-subject" type="text" {...register('subject')} className={inputClass} placeholder={t('subject')} />
          {errors.subject && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>

        {/* Row 7: Message — full width */}
        <div className="nav:col-span-2">
          <label htmlFor="cf-message" className={labelClass}>{t('message')} *</label>
          <textarea
            id="cf-message"
            rows={4}
            {...register('message')}
            className={inputClass.replace('h-[46px]', '') + ' h-auto py-3'}
            placeholder={t('message')}
          />
          {errors.message && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>

        {/* Row 8: KVKK checkboxes + Turnstile */}
        <div className="nav:col-span-2 grid nav:grid-cols-2 gap-4 items-start">
          <div className="space-y-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" {...register('kvkk1')} className="mt-1 accent-primary flex-shrink-0" />
              <span className={dark ? 'text-white/80 text-xs leading-relaxed' : 'text-secondary-text text-xs leading-relaxed'}>
                {t('kvkk1')}
              </span>
            </label>
            {errors.kvkk1 && <p className={errorClass} role="alert">{t('required')}</p>}
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" {...register('kvkk2')} className="mt-1 accent-primary flex-shrink-0" />
              <span className={dark ? 'text-white/80 text-xs leading-relaxed' : 'text-secondary-text text-xs leading-relaxed'}>
                {t('kvkk2')}
              </span>
            </label>
          </div>
          <div className="flex flex-col items-start gap-3">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
              onSuccess={setTurnstileToken}
              onExpire={() => setTurnstileToken(undefined)}
              options={{ appearance: 'always', theme: dark ? 'dark' : 'light' }}
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
        <p role="alert" className="text-red-400 text-sm mt-4">{submitError}</p>
      )}
    </form>
  );
}
