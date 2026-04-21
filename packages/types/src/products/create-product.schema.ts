import { z } from 'zod';
import { LocaleMapRequiredSchema, LocaleMapSchema } from '../shared/locale-map';
import { ContentStatus } from '../shared/enums';
import { ProductFeaturesSchema } from '../jsonb/product-features';

export const CreateProductSchema = z.object({
  slug: z.object({ tr: z.string().min(1), en: z.string().min(1) }),
  name: LocaleMapRequiredSchema,
  tagline: LocaleMapSchema,
  description: LocaleMapSchema,
  features: ProductFeaturesSchema.optional(),
  status: z.nativeEnum(ContentStatus).default('DRAFT'),
});
export type CreateProductDto = z.infer<typeof CreateProductSchema>;
