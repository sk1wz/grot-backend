import { Prisma } from '@/db';

export type CreateNotificationParams = {
  userId: string;
  title: string;
  message: string;
  payload?: Prisma.InputJsonValue;
};
