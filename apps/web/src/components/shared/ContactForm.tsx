'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n';

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  title: z.string().optional(),
  department: z.string().min(1),
  company: z.string().min(1),
  phone: z.string().optional(),
  message: z.string().optional(),
  kvkk1: z.boolean().refine((v) => v, { message: 'required' }),
  kvkk2: z.boolean().optional(),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    setSubmitError(null);

    const { kvkk1, ...fieldData } = data;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/public/forms/contact/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: fieldData,
            consentGiven: kvkk1 === true,
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

  const inputClass = dark
    ? 'bg-transparent border border-white/40 text-white placeholder:text-white/67 h-[46px] px-4 w-full text-sm outline-none focus:border-primary'
    : 'border border-gray-200 h-[46px] px-4 w-full text-sm outline-none focus:border-primary bg-white text-heading';

  const labelClass = dark ? 'text-white/80 text-xs mb-1 block' : 'text-secondary-text text-xs mb-1 block';
  const errorClass = 'text-error text-xs mt-1';

  if (success) {
    return (
      <div className={`p-6 text-center ${dark ? 'text-white' : 'text-heading'}`}>
        <p className="text-success text-lg font-medium">{t('successMessage')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label={t('sectionLabel')}>
      <div className="grid grid-cols-1 nav:grid-cols-2 gap-4">
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
        <div>
          <label htmlFor="cf-email" className={labelClass}>{t('email')} *</label>
          <input id="cf-email" type="email" {...register('email')} className={inputClass} placeholder={t('email')} />
          {errors.email && <p className={errorClass} role="alert">{t('invalidEmail')}</p>}
        </div>
        <div>
          <label htmlFor="cf-title" className={labelClass}>{t('title')}</label>
          <input id="cf-title" type="text" {...register('title')} className={inputClass} placeholder={t('title')} />
        </div>
        <div>
          <label htmlFor="cf-department" className={labelClass}>{t('department')} *</label>
          <select id="cf-department" {...register('department')} className={inputClass}>
            <option value="">{t('selectDepartment')}</option>
            <option value="it">{t('deptIT')}</option>
            <option value="security">{t('deptSecurity')}</option>
            <option value="management">{t('deptManagement')}</option>
            <option value="other">{t('deptOther')}</option>
          </select>
          {errors.department && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>
        <div>
          <label htmlFor="cf-company" className={labelClass}>{t('company')} *</label>
          <input id="cf-company" type="text" {...register('company')} className={inputClass} placeholder={t('company')} />
          {errors.company && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>
        <div className="nav:col-span-2">
          <label htmlFor="cf-message" className={labelClass}>{t('message')}</label>
          <textarea
            id="cf-message"
            rows={4}
            {...register('message')}
            className={inputClass.replace('h-[46px]', '') + ' h-auto py-3'}
            placeholder={t('message')}
          />
        </div>
        <div className="nav:col-span-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('kvkk1')}
              className="mt-1 accent-primary"
            />
            <span className={dark ? 'text-white/80 text-xs' : 'text-secondary-text text-xs'}>
              {t('kvkk1')}
            </span>
          </label>
          {errors.kvkk1 && <p className={errorClass} role="alert">{t('required')}</p>}
        </div>
        <div className="nav:col-span-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('kvkk2')}
              className="mt-1 accent-primary"
            />
            <span className={dark ? 'text-white/80 text-xs' : 'text-secondary-text text-xs'}>
              {t('kvkk2')}
            </span>
          </label>
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
