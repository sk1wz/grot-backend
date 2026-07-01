import { NotificationService } from '@/notification/notification.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  NOTIFICATION_CREATE_JOB,
  NOTIFICATION_QUEUE,
  NotificationJobData,
} from './notification-queue.constants';

@Processor(NOTIFICATION_QUEUE, { concurrency: 10 })
export class NotificationProcessor extends WorkerHost {
  public constructor(
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  public async process(job: Job<NotificationJobData>): Promise<void> {
    if (job.name !== NOTIFICATION_CREATE_JOB) {
      return;
    }

    await this.notificationService.create(job.data);
  }
}
