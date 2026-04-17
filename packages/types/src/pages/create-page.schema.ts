import { z } from 'zod';
import { ContentStatus } from '../shared/enums';

export const CreatePageSchema = z.object({
  slug: z.object({ tr: z.string().min(1), en: z.string().min(1) }),
  status: z.nativeEnum(ContentStatus).default('DRAFT'),
  scheduledAt: z.string().datetime().optional(),
});
export type CreatePageDto = z.infer<typeof CreatePageSchema>;
