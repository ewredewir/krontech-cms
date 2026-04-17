import { z } from 'zod';
import { CreateBlogPostSchema } from './create-blog-post.schema';

export const UpdateBlogPostSchema = CreateBlogPostSchema.partial();
export type UpdateBlogPostDto = z.infer<typeof UpdateBlogPostSchema>;
