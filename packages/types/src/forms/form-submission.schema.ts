import { z } from 'zod';

export const SubmitFormSchema = z.object({
  data: z.record(z.unknown()),
  consentGiven: z.literal(true, { errorMap: () => ({ message: 'Consent is required' }) }),
  turnstileToken: z.string().optional(),
  _honeypot: z.string().max(0, 'Bot detected').optional(),
});
export type SubmitFormDto = z.infer<typeof SubmitFormSchema>;
