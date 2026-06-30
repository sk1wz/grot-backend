import { Module, forwardRef } from '@nestjs/common';
import { CheckModule } from '@/check/check.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { ReportModule } from '@/report/report.module';
import { CheckBullModule } from './check/check-bull.module';
import { CheckQueueService } from './check/check-queue.service';
import {
  BankruptcyCheckProcessor,
  FsspCheckProcessor,
  GibddCheckProcessor,
  GistorgiCheckProcessor,
  InnCheckProcessor,
} from './check/check.processors';
import { QueueRecoveryService } from './queue-recovery.service';
import { ReportQueueService } from './report/report-queue.service';
import { ReportProcessor } from './report/report.processors';

@Module({
  imports: [
    CheckBullModule,
    PrismaModule,
    forwardRef(() => CheckModule),
    forwardRef(() => ReportModule),
  ],
  providers: [
    CheckQueueService,
    ReportQueueService,
    QueueRecoveryService,
    GibddCheckProcessor,
    GistorgiCheckProcessor,
    FsspCheckProcessor,
    BankruptcyCheckProcessor,
    InnCheckProcessor,
    ReportProcessor,
  ],
  exports: [CheckQueueService, ReportQueueService],
})
export class QueueModule {}
