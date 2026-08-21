import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { BalanceModule } from '@/balance/balance.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { QueueModule } from '@/queue/queue.module';
import { CheckModule } from '@/check/check.module';
import { ReportModule } from '@/report/report.module';
import { BatchService } from './batch.service';
import { BatchGateway } from './batch.gateway';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    BalanceModule,
    ReportModule,
    forwardRef(() => QueueModule),
    forwardRef(() => CheckModule),
  ],
  providers: [BatchService, BatchGateway],
  exports: [BatchService],
})
export class BatchModule {}
