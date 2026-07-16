import { User, UserRole } from '@/db';
import { Decimal } from '@prisma/client/runtime/client';

export class UserResponse {
  id: string;
  email: string;
  role: UserRole;
  picture: string | null;
  balance: Decimal;
  createdAt: Date;

  static fromUser(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      picture: user.picture,
      balance: user.balance,
      createdAt: user.createdAt,
    };
  }
}
