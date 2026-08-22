import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IS_DEV_ENV } from '@/utils/is.dev';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { UserModule } from '@/user/user.module';
import { CheckModule } from '@/check/check.module';
import { BalanceModule } from '@/balance/balance.module';
import { QueueModule } from '@/queue/queue.module';
import { BatchModule } from '@/batch/batch.module';
import { FeedbackModule } from '@/feedback/feedback.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: !IS_DEV_ENV,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    BalanceModule,
    BatchModule,
    FeedbackModule,
    CheckModule,
    QueueModule,
  ],
})
export class AppModule {}
