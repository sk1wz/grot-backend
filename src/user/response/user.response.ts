import { User, UserRole } from '@/db';

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
