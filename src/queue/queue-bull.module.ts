import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CHECK_SINGLE_QUEUE } from './check/check-queue.constants';
import { REPORT_QUEUE } from './report/report-queue.constants';

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
      { name: CHECK_SINGLE_QUEUE },
      { name: REPORT_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueueBullModule {}
