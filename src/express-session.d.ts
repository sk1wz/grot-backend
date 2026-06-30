import { UserRole } from '@prisma/__generated__/enums';
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    role?: UserRole;
  }
}
