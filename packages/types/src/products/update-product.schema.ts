import { z } from 'zod';
import { CreateProductSchema } from './create-product.schema';

export const UpdateProductSchema = CreateProductSchema.partial();
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
