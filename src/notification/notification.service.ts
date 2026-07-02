import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { CreateNotificationDto } from './dto';
import { Notification } from '@/db';

@Injectable()
export class NotificationService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  public async getAllNotifications(userId: string): Promise<Notification[]> {
    return this.prismaService.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = await this.prismaService.notification.create({
      data: dto,
    });

    this.notificationGateway.emitNotificationUpdated(dto.userId, notification);

    return notification;
  }

  public async makeRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.prismaService.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Уведомление не найдено');
    }

    if (notification.isRead) {
      return notification;
    }

    const updatedNotification = await this.prismaService.notification.update({
      where: { id },
      data: { isRead: true },
    });

    this.notificationGateway.emitNotificationUpdated(
      userId,
      updatedNotification,
    );

    return updatedNotification;
  }

  public async makeReadAll(userId: string): Promise<Notification[]> {
    const unreadNotifications = await this.prismaService.notification.findMany({
      where: { userId, isRead: false },
      select: { id: true },
    });

    if (!unreadNotifications.length) {
      return [];
    }

    const unreadIds = unreadNotifications.map(({ id }) => id);

    await this.prismaService.notification.updateMany({
      where: { id: { in: unreadIds } },
      data: { isRead: true },
    });

    const updatedNotifications = await this.prismaService.notification.findMany(
      {
        where: { id: { in: unreadIds } },
        orderBy: { createdAt: 'desc' },
      },
    );

    updatedNotifications.forEach((notification) => {
      this.notificationGateway.emitNotificationUpdated(userId, notification);
    });

    return updatedNotifications;
  }
}
