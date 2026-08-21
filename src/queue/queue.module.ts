import { Module, forwardRef } from '@nestjs/common';
import { CheckModule } from '@/check/check.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { QueueBullModule } from './queue-bull.module';
import { CheckQueueService } from './check/check-queue.service';
import { CheckProcessor } from './check/check.processors';
import { QueueRecoveryService } from './queue-recovery.service';
import { BatchModule } from '@/batch/batch.module';
import { BatchQueueService } from './batch/batch-queue.service';
import {
  GibddBatchProcessor,
  OtherBatchProcessor,
} from './batch/batch.processors';

@Module({
  imports: [
    QueueBullModule,
    PrismaModule,
    forwardRef(() => CheckModule),
    forwardRef(() => BatchModule),
  ],
  providers: [
    CheckQueueService,
    QueueRecoveryService,
    CheckProcessor,
    BatchQueueService,
    GibddBatchProcessor,
    OtherBatchProcessor,
  ],
  exports: [CheckQueueService, BatchQueueService],
})
export class QueueModule {}
