import { z } from 'zod';
import { LocaleMapRequiredSchema } from '../shared/locale-map';

export const ProductFeatureSchema = z.object({
  title: LocaleMapRequiredSchema,
  description: LocaleMapRequiredSchema,
});
export const ProductFeaturesSchema = z.array(ProductFeatureSchema);
export type ProductFeature = z.infer<typeof ProductFeatureSchema>;
