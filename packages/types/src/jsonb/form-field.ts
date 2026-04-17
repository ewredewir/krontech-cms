import { z } from 'zod';
import { LocaleMapRequiredSchema } from '../shared/locale-map';

export const FormFieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['text', 'email', 'phone', 'select', 'textarea', 'checkbox']),
  label: LocaleMapRequiredSchema,
  required: z.boolean().default(false),
  options: z.array(z.object({
    value: z.string(),
    label: LocaleMapRequiredSchema,
  })).optional(),
  maxLength: z.number().int().positive().optional(),
});
export type FormField = z.infer<typeof FormFieldSchema>;

export const FormFieldsSchema = z.array(FormFieldSchema).min(1);
