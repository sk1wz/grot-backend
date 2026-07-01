import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  NOTIFICATION_CREATE_JOB,
  NOTIFICATION_QUEUE,
  NotificationJobData,
} from './notification-queue.constants';

@Injectable()
export class NotificationQueueService {
  public constructor(
    @InjectQueue(NOTIFICATION_QUEUE)
    private readonly queue: Queue<NotificationJobData>,
  ) {}

  public async enqueueCreate(data: NotificationJobData): Promise<void> {
    await this.queue.add(NOTIFICATION_CREATE_JOB, data, {
      removeOnComplete: true,
      removeOnFail: 100,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2_000,
      },
    });
  }

  public async recoverFailedCreates(limit = 100): Promise<number> {
    const failedJobs = await this.queue.getJobs(
      ['failed'],
      0,
      limit - 1,
      false,
    );

    let recovered = 0;

    for (const job of failedJobs) {
      try {
        await job.retry();
        recovered += 1;
      } catch {
        // Ignore retry errors to continue recovering remaining jobs.
      }
    }

    return recovered;
  }
}
