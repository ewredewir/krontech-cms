import { z } from 'zod';
import { CreatePageSchema } from './create-page.schema';

export const UpdatePageSchema = CreatePageSchema.partial();
export type UpdatePageDto = z.infer<typeof UpdatePageSchema>;
