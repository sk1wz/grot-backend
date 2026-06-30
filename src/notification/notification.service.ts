import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/__generated__/client';
import { NotificationGateway } from './notification.gateway';

type CreateNotificationParams = {
  userId: string;
  title: string;
  message: string;
  payload?: Prisma.InputJsonValue;
};

@Injectable()
export class NotificationService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  public async createAndDispatch(params: CreateNotificationParams) {
    const notification = await this.prismaService.notification.create({
      data: params,
    });

    this.notificationGateway.emitNotificationCreated(
      params.userId,
      notification,
    );

    return notification;
  }

  public async getUserNotifications(userId: string) {
    return this.prismaService.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
