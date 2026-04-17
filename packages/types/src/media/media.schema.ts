import { z } from 'zod';
import { LocaleMapSchema } from '../shared/locale-map';

export const UpdateMediaSchema = z.object({
  altText: LocaleMapSchema.optional(),
});
export type UpdateMediaDto = z.infer<typeof UpdateMediaSchema>;
