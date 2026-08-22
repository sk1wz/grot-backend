import { User, UserRole } from '@/db';
import { Decimal } from '@prisma/client/runtime/client';

export type UserResponse = {
  id: string;
  email: string;
  role: UserRole;
  isBlocked: boolean;
  picture: string | null;
  balance: Decimal;
  createdAt: Date;
};

export class UserResponseDto {
  public static fromUser(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      picture: user.picture,
      balance: user.balance,
      createdAt: user.createdAt,
    };
  }
}
