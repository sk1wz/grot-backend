import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { CreateNotificationParams } from './types/notification.types';

@Injectable()
export class NotificationService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  public async getAllNotifications(userId: string) {
    return this.prismaService.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async create(params: CreateNotificationParams) {
    const notification = await this.prismaService.notification.create({
      data: params,
    });

    this.notificationGateway.emitNotificationCreated(
      params.userId,
      notification,
    );

    return notification;
  }
}
