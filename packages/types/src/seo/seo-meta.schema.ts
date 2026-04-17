import { z } from 'zod';
import { LocaleMapSchema } from '../shared/locale-map';

export const UpdateSeoMetaSchema = z.object({
  metaTitle: LocaleMapSchema.optional(),
  metaDescription: LocaleMapSchema.optional(),
  canonical: z.string().url().optional().nullable(),
  robots: z.string().default('index, follow'),
  ogImageId: z.string().uuid().optional().nullable(),
  jsonLdType: z.string().optional().nullable(),
  jsonLdOverride: z.record(z.unknown()).optional().nullable(),
});
export type UpdateSeoMetaDto = z.infer<typeof UpdateSeoMetaSchema>;
