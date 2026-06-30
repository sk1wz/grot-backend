import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ReportService } from '@/report/report.service';
import {
  REPORT_GENERATE_JOB,
  REPORT_QUEUE,
  ReportJobData,
} from './report-queue.constants';

@Processor(REPORT_QUEUE, { concurrency: 1 })
export class ReportProcessor extends WorkerHost {
  public constructor(private readonly reportService: ReportService) {
    super();
  }

  public async process(job: Job<ReportJobData>): Promise<void> {
    if (job.name !== REPORT_GENERATE_JOB) {
      return;
    }

    await this.reportService.generateReport(job.data.reportId);
  }
}
