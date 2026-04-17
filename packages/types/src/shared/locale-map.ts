import { z } from 'zod';

export const LocaleMapSchema = z.object({
  tr: z.string(),
  en: z.string(),
});
export type LocaleMap = z.infer<typeof LocaleMapSchema>;

export const LocaleMapRequiredSchema = z.object({
  tr: z.string().min(1, 'Turkish value is required'),
  en: z.string().min(1, 'English value is required'),
});
