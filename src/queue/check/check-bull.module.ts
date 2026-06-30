import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CHECK_QUEUES } from './check-queue.constants';
import { REPORT_QUEUE } from '../report/report-queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.getOrThrow<string>('REDIS_URI'),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: CHECK_QUEUES.GIBDD },
      { name: CHECK_QUEUES.GISTORGI },
      { name: CHECK_QUEUES.FSSP },
      { name: CHECK_QUEUES.BANKRUPTCY },
      { name: CHECK_QUEUES.INN },
      { name: REPORT_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class CheckBullModule {}
