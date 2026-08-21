import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BatchService } from '@/batch/batch.service';
import {
  BATCH_GIBDD_QUEUE,
  BATCH_OTHER_QUEUE,
  BatchJobData,
} from './batch-queue.constants';

@Processor(BATCH_GIBDD_QUEUE, { concurrency: 1 })
export class GibddBatchProcessor extends WorkerHost {
  public constructor(private readonly batchService: BatchService) {
    super();
  }
  public process(job: Job<BatchJobData>): Promise<void> {
    return this.batchService.processBatch(job.data.batchId);
  }
}

@Processor(BATCH_OTHER_QUEUE, { concurrency: 1 })
export class OtherBatchProcessor extends WorkerHost {
  public constructor(private readonly batchService: BatchService) {
    super();
  }
  public process(job: Job<BatchJobData>): Promise<void> {
    return this.batchService.processBatch(job.data.batchId);
  }
}
