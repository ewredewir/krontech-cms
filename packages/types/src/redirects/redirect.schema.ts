import { z } from 'zod';

export const CreateRedirectSchema = z.object({
  source: z.string().startsWith('/'),
  destination: z.string().min(1),
  statusCode: z.union([z.literal(301), z.literal(302)]).default(301),
  isActive: z.boolean().default(true),
});
export type CreateRedirectDto = z.infer<typeof CreateRedirectSchema>;

export const UpdateRedirectSchema = CreateRedirectSchema.partial();
export type UpdateRedirectDto = z.infer<typeof UpdateRedirectSchema>;
