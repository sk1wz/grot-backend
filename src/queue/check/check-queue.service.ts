import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@prisma/__generated__/enums';
import { Queue, JobType } from 'bullmq';
import {
  CHECK_QUEUES,
  CHECK_SUBMIT_JOB,
  CHECK_SYNC_DELAY_MS,
  CHECK_SYNC_JOB,
  CheckJobData,
  QueuedCheckModule,
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
  private readonly queues: Record<QueuedCheckModule, Queue<CheckJobData>>;

  public constructor(
    @InjectQueue(CHECK_QUEUES.GIBDD)
    gibddQueue: Queue<CheckJobData>,
    @InjectQueue(CHECK_QUEUES.GISTORGI)
    gistorgiQueue: Queue<CheckJobData>,
    @InjectQueue(CHECK_QUEUES.FSSP)
    fsspQueue: Queue<CheckJobData>,
    @InjectQueue(CHECK_QUEUES.BANKRUPTCY)
    bankruptcyQueue: Queue<CheckJobData>,
    @InjectQueue(CHECK_QUEUES.INN)
    innQueue: Queue<CheckJobData>,
  ) {
    this.queues = {
      [CheckModuleEnums.GIBDD]: gibddQueue,
      [CheckModuleEnums.GISTORGI]: gistorgiQueue,
      [CheckModuleEnums.FSSP]: fsspQueue,
      [CheckModuleEnums.BANKRUPTCY]: bankruptcyQueue,
      [CheckModuleEnums.INN]: innQueue,
    };
  }

  public async enqueueSubmit(
    module: QueuedCheckModule,
    checkId: string,
  ): Promise<void> {
    const queue = this.getQueue(module);

    await queue.add(
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

  public async enqueueSync(
    module: QueuedCheckModule,
    checkId: string,
  ): Promise<void> {
    const queue = this.getQueue(module);

    await queue.add(
      CHECK_SYNC_JOB,
      { checkId },
      {
        delay: CHECK_SYNC_DELAY_MS,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }

  public async ensureSubmit(
    module: QueuedCheckModule,
    checkId: string,
  ): Promise<boolean> {
    const queue = this.getQueue(module);
    const existing = await queue.getJob(checkId);

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

    await this.enqueueSubmit(module, checkId);
    return true;
  }

  public async ensureSync(
    module: QueuedCheckModule,
    checkId: string,
  ): Promise<boolean> {
    if (await this.hasPendingSyncJob(module, checkId)) {
      return false;
    }

    await this.enqueueSync(module, checkId);
    return true;
  }

  private async hasPendingSyncJob(
    module: QueuedCheckModule,
    checkId: string,
  ): Promise<boolean> {
    const queue = this.getQueue(module);

    for (const state of PENDING_JOB_STATES) {
      const jobs = await queue.getJobs([state], 0, 100);

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

  private getQueue(module: QueuedCheckModule): Queue<CheckJobData> {
    return this.queues[module];
  }
}
