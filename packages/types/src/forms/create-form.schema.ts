import { z } from 'zod';
import { FormFieldsSchema } from '../jsonb/form-field';

export const CreateFormSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  fields: FormFieldsSchema,
  webhookUrl: z.string().url().optional().nullable(),
  notifyEmail: z.string().email().optional().nullable(),
  isActive: z.boolean().default(true),
});
export type CreateFormDto = z.infer<typeof CreateFormSchema>;

export const UpdateFormSchema = CreateFormSchema.partial();
export type UpdateFormDto = z.infer<typeof UpdateFormSchema>;
