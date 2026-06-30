import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  REPORT_GENERATE_JOB,
  REPORT_QUEUE,
  ReportJobData,
} from './report-queue.constants';

@Injectable()
export class ReportQueueService {
  public constructor(
    @InjectQueue(REPORT_QUEUE)
    private readonly queue: Queue<ReportJobData>,
  ) {}

  public async enqueueGenerate(reportId: string): Promise<void> {
    await this.queue.add(
      REPORT_GENERATE_JOB,
      { reportId },
      {
        jobId: reportId,
        removeOnComplete: true,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5_000,
        },
      },
    );
  }

  public async ensureGenerate(reportId: string): Promise<boolean> {
    const existing = await this.queue.getJob(reportId);

    if (existing) {
      const state = await existing.getState();

      if (
        ['waiting', 'active', 'delayed', 'paused', 'prioritized'].includes(
          state,
        )
      ) {
        return false;
      }

      if (state === 'failed') {
        await existing.retry();
        return true;
      }
    }

    await this.enqueueGenerate(reportId);
    return true;
  }
}
