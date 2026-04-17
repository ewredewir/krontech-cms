import { z } from 'zod';

export const PublishPageSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
});
export type PublishPageDto = z.infer<typeof PublishPageSchema>;
