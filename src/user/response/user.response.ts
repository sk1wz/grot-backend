import { User } from '@prisma/__generated__/client';
import { UserRole } from '@prisma/__generated__/enums';

export class UserResponse {
  id: string;
  email: string;
  role: UserRole;
  picture: string | null;
  balance: number;
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
