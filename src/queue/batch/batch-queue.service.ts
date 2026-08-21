import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CheckModuleEnums } from '@/db';
import {
  BATCH_GIBDD_QUEUE,
  BATCH_OTHER_QUEUE,
  BATCH_RUN_JOB,
  BatchJobData,
} from './batch-queue.constants';

@Injectable()
export class BatchQueueService {
  public constructor(
    @InjectQueue(BATCH_GIBDD_QUEUE) private readonly gibdd: Queue<BatchJobData>,
    @InjectQueue(BATCH_OTHER_QUEUE) private readonly other: Queue<BatchJobData>,
  ) {}

  public async enqueue(
    batchId: string,
    module: CheckModuleEnums,
  ): Promise<void> {
    const queue = module === CheckModuleEnums.GIBDD ? this.gibdd : this.other;
    await queue.add(
      BATCH_RUN_JOB,
      { batchId },
      {
        jobId: batchId,
        removeOnComplete: true,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
      },
    );
  }
}
