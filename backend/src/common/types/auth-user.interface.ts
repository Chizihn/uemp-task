import { Role } from '@prisma/client';

/** Shape attached to `req.user` by the JWT access-token strategy. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}
