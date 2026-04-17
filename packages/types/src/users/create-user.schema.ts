import { z } from 'zod';
import { UserRole } from '../shared/enums';

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole).default('EDITOR'),
});
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
