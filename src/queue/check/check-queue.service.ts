import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue, JobType } from 'bullmq';
import {
  CHECK_SINGLE_QUEUE,
  CHECK_SUBMIT_JOB,
  CHECK_SYNC_DELAY_MS,
  CHECK_SYNC_JOB,
  CheckJobData,
} from './check-queue.constants';

const PENDING_JOB_STATES: JobType[] = [
  'waiting',
  'active',
  'delayed',
  'paused',
  'prioritized',
  'waiting-children',
];

@Injectable()
export class CheckQueueService {
  public constructor(
    @InjectQueue(CHECK_SINGLE_QUEUE)
    private readonly queue: Queue<CheckJobData>,
  ) {}

  public async enqueueSubmit(checkId: string): Promise<void> {
    await this.queue.add(
      CHECK_SUBMIT_JOB,
      { checkId },
      {
        jobId: checkId,
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

  public async enqueueSync(checkId: string): Promise<void> {
    await this.queue.add(
      CHECK_SYNC_JOB,
      { checkId },
      {
        delay: CHECK_SYNC_DELAY_MS,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }

  public async ensureSubmit(checkId: string): Promise<boolean> {
    const existing = await this.queue.getJob(checkId);

    if (existing) {
      const state = await existing.getState();

      if (this.isPendingState(state)) {
        return false;
      }

      if (state === 'failed') {
        await existing.retry();
        return true;
      }
    }

    await this.enqueueSubmit(checkId);
    return true;
  }

  public async ensureSync(checkId: string): Promise<boolean> {
    if (await this.hasPendingSyncJob(checkId)) {
      return false;
    }

    await this.enqueueSync(checkId);
    return true;
  }

  private async hasPendingSyncJob(checkId: string): Promise<boolean> {
    for (const state of PENDING_JOB_STATES) {
      const jobs = await this.queue.getJobs([state], 0, 100);

      if (
        jobs.some(
          (job) => job.name === CHECK_SYNC_JOB && job.data.checkId === checkId,
        )
      ) {
        return true;
      }
    }

    return false;
  }

  private isPendingState(state: string): boolean {
    return PENDING_JOB_STATES.includes(state as JobType);
  }
}
