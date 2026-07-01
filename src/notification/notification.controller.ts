import { Auth } from '@/auth/decorators/auth.decorator';
import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  public constructor(
    private readonly notificationService: NotificationService,
  ) {}

  @Auth()
  @Get()
  public getAllNotifications(@Req() req: Request) {
    return this.notificationService.getAllNotifications(req.session.userId!);
  }
}
