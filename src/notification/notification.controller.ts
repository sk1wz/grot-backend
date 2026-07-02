import { Auth } from '@/auth/decorators/auth.decorator';
import { Controller, Get, Param, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NotificationService } from './notification.service';
import { MakeReadNotificationDto } from './dto';

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

  @Auth()
  @Patch('make-read/:id')
  public makeRead(
    @Req() req: Request,
    @Param() params: MakeReadNotificationDto,
  ) {
    return this.notificationService.makeRead(req.session.userId!, params.id);
  }

  @Auth()
  @Patch('make-read-all')
  public makeReadAll(@Req() req: Request) {
    return this.notificationService.makeReadAll(req.session.userId!);
  }
}
