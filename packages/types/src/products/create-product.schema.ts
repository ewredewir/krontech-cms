import { z } from 'zod';
import { LocaleMapRequiredSchema, LocaleMapSchema } from '../shared/locale-map';
import { ContentStatus } from '../shared/enums';

export const CreateProductSchema = z.object({
  slug: z.object({ tr: z.string().min(1), en: z.string().min(1) }),
  name: LocaleMapRequiredSchema,
  tagline: LocaleMapSchema,
  description: LocaleMapSchema,
  status: z.nativeEnum(ContentStatus).default('DRAFT'),
});
export type CreateProductDto = z.infer<typeof CreateProductSchema>;
