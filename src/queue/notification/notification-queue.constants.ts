import { Prisma } from '@prisma/__generated__/client';

export const NOTIFICATION_QUEUE = 'notifications';

export const NOTIFICATION_CREATE_JOB = 'create-notification';

export type NotificationJobData = {
  userId: string;
  title: string;
  message: string;
  payload?: Prisma.InputJsonValue;
};
