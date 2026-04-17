import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class PaginationDto extends createZodDto(PaginationSchema) {}
export type Pagination = z.infer<typeof PaginationSchema>;
