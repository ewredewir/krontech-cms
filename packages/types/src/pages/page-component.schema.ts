import { z } from 'zod';
import { PageComponentType } from '../shared/enums';

export const CreatePageComponentSchema = z.object({
  pageId: z.string().uuid(),
  type: z.nativeEnum(PageComponentType),
  order: z.number().int().min(0),
  data: z.record(z.unknown()),
  isVisible: z.boolean().default(true),
});
export type CreatePageComponentDto = z.infer<typeof CreatePageComponentSchema>;

export const UpdatePageComponentSchema = CreatePageComponentSchema.omit({ pageId: true, type: true }).partial();
export type UpdatePageComponentDto = z.infer<typeof UpdatePageComponentSchema>;

export const ReorderComponentsSchema = z.object({
  components: z.array(z.object({
    id: z.string().uuid(),
    order: z.number().int().min(0),
  })),
});
export type ReorderComponentsDto = z.infer<typeof ReorderComponentsSchema>;
