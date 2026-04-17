import { z } from 'zod';

export const ReorderProductMediaSchema = z.object({
  mediaItems: z.array(z.object({
    mediaId: z.string().uuid(),
    order: z.number(),
  })),
});
export type ReorderProductMediaDto = z.infer<typeof ReorderProductMediaSchema>;
