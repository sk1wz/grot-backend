import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CheckService } from '@/check/check.service';
import {
  CHECK_QUEUES,
  CHECK_SUBMIT_JOB,
  CHECK_SYNC_JOB,
  CheckJobData,
} from './check-queue.constants';

abstract class CheckJobProcessor extends WorkerHost {
  public constructor(protected readonly checkService: CheckService) {
    super();
  }

  public async process(job: Job<CheckJobData>): Promise<void> {
    switch (job.name) {
      case CHECK_SUBMIT_JOB:
        await this.checkService.submitFinder(job.data.checkId);
        return;
      case CHECK_SYNC_JOB:
        await this.checkService.checkFinderById(job.data.checkId);
        return;
    }
  }
}

@Processor(CHECK_QUEUES.GIBDD)
export class GibddCheckProcessor extends CheckJobProcessor {
  public constructor(checkService: CheckService) {
    super(checkService);
  }
}

@Processor(CHECK_QUEUES.GISTORGI)
export class GistorgiCheckProcessor extends CheckJobProcessor {
  public constructor(checkService: CheckService) {
    super(checkService);
  }
}

@Processor(CHECK_QUEUES.FSSP)
export class FsspCheckProcessor extends CheckJobProcessor {
  public constructor(checkService: CheckService) {
    super(checkService);
  }
}

@Processor(CHECK_QUEUES.BANKRUPTCY)
export class BankruptcyCheckProcessor extends CheckJobProcessor {
  public constructor(checkService: CheckService) {
    super(checkService);
  }
}

@Processor(CHECK_QUEUES.INN)
export class InnCheckProcessor extends CheckJobProcessor {
  public constructor(checkService: CheckService) {
    super(checkService);
  }
}
