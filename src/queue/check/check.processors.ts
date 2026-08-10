import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CheckService } from '@/check/check.service';
import {
  CHECK_SINGLE_QUEUE,
  CHECK_SUBMIT_JOB,
  CHECK_SYNC_JOB,
  CheckJobData,
} from './check-queue.constants';

@Processor(CHECK_SINGLE_QUEUE, { concurrency: 1 })
export class CheckProcessor extends WorkerHost {
  public constructor(private readonly checkService: CheckService) {
    super();
  }

  public async process(job: Job<CheckJobData>): Promise<void> {
    switch (job.name) {
      case CHECK_SUBMIT_JOB:
        return;
      case CHECK_SYNC_JOB:
        return;
    }
  }
}
