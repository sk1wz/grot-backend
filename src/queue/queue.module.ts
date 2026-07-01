import { Module, forwardRef } from '@nestjs/common';
import { CheckModule } from '@/check/check.module';
import { NotificationModule } from '@/notification/notification.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { ReportModule } from '@/report/report.module';
import { QueueBullModule } from './queue-bull.module';
import { CheckQueueService } from './check/check-queue.service';
import {
  BankruptcyCheckProcessor,
  FsspCheckProcessor,
  GibddCheckProcessor,
  GistorgiCheckProcessor,
  InnCheckProcessor,
} from './check/check.processors';
import { QueueRecoveryService } from './queue-recovery.service';
import { NotificationProcessor } from './notification/notification.processors';
import { NotificationQueueService } from './notification/notification-queue.service';
import { ReportQueueService } from './report/report-queue.service';
import { ReportProcessor } from './report/report.processors';

@Module({
  imports: [
    QueueBullModule,
    PrismaModule,
    forwardRef(() => CheckModule),
    forwardRef(() => ReportModule),
    forwardRef(() => NotificationModule),
  ],
  providers: [
    CheckQueueService,
    ReportQueueService,
    NotificationQueueService,
    QueueRecoveryService,
    GibddCheckProcessor,
    GistorgiCheckProcessor,
    FsspCheckProcessor,
    BankruptcyCheckProcessor,
    InnCheckProcessor,
    ReportProcessor,
    NotificationProcessor,
  ],
  exports: [CheckQueueService, ReportQueueService, NotificationQueueService],
})
export class QueueModule {}
