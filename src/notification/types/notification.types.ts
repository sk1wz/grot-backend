import { Prisma } from '@prisma/__generated__/client';

export type CreateNotificationParams = {
  userId: string;
  title: string;
  message: string;
  payload?: Prisma.InputJsonValue;
};
