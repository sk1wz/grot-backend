import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CHECK_SINGLE_QUEUE } from './check/check-queue.constants';
import {
  BATCH_GIBDD_QUEUE,
  BATCH_OTHER_QUEUE,
} from './batch/batch-queue.constants';

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
      { name: BATCH_GIBDD_QUEUE },
      { name: BATCH_OTHER_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueueBullModule {}
