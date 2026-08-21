import { Module, forwardRef } from '@nestjs/common';
import { CheckModule } from '@/check/check.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { QueueBullModule } from './queue-bull.module';
import { CheckQueueService } from './check/check-queue.service';
import { CheckProcessor } from './check/check.processors';
import { QueueRecoveryService } from './queue-recovery.service';

@Module({
  imports: [
    QueueBullModule,
    PrismaModule,
    forwardRef(() => CheckModule),
  ],
  providers: [
    CheckQueueService,
    QueueRecoveryService,
    CheckProcessor,
  ],
  exports: [CheckQueueService],
})
export class QueueModule {}
