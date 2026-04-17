import { z } from 'zod';
import { LocaleMapRequiredSchema, LocaleMapSchema } from '../shared/locale-map';
import { ContentStatus } from '../shared/enums';

export const CreateBlogPostSchema = z.object({
  slug: z.object({ tr: z.string().min(1), en: z.string().min(1) }),
  title: LocaleMapRequiredSchema,
  excerpt: LocaleMapSchema,
  body: LocaleMapSchema,
  status: z.nativeEnum(ContentStatus).default('DRAFT'),
  categoryId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).default([]),
  featuredImageId: z.string().uuid().optional(),
  scheduledAt: z.string().datetime().optional(),
});
export type CreateBlogPostDto = z.infer<typeof CreateBlogPostSchema>;
