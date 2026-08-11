import { CheckQueueService } from '@/queue/check/check-queue.service';
import { CHECK_QUEUE_MODULES } from '@/queue/check/check-queue.constants';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { CheckStatusEnums } from '@/db';

@Injectable()
export class QueueRecoveryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(QueueRecoveryService.name);

  public constructor(
    private readonly prismaService: PrismaService,
    private readonly checkQueueService: CheckQueueService,
  ) {}

  public onApplicationBootstrap(): void {
    void this.recoverOnStartup();
  }

  private async recoverOnStartup(): Promise<void> {
    const [submitRecovered, syncRecovered] =
      await Promise.all([
        this.recoverPendingSubmits(),
        this.recoverActiveSyncs(),
      ]);

    const total = submitRecovered + syncRecovered;

    if (total === 0) {
      this.logger.log('Startup queue recovery: nothing to recover');
      return;
    }

    this.logger.log(
      `Startup queue recovery: ${submitRecovered} submit, ${syncRecovered} sync, jobs re-enqueued`,
    );
  }

  private async recoverPendingSubmits(): Promise<number> {
    const checks = await this.prismaService.check.findMany({
      where: {
        status: CheckStatusEnums.PENDING,
        serviceId: null,
        module: { in: [...CHECK_QUEUE_MODULES] },
      },
      select: { id: true },
    });

    let recovered = 0;

    for (const check of checks) {
      const enqueued = await this.checkQueueService.ensureSubmit(check.id);

      if (enqueued) {
        recovered += 1;
      }
    }

    return recovered;
  }

  private async recoverActiveSyncs(): Promise<number> {
    const checks = await this.prismaService.check.findMany({
      where: {
        status: {
          in: [CheckStatusEnums.QUEUED, CheckStatusEnums.RUNNING],
        },
        serviceId: { not: null },
        module: { in: [...CHECK_QUEUE_MODULES] },
      },
      select: { id: true },
    });

    let recovered = 0;

    for (const check of checks) {
      const enqueued = await this.checkQueueService.ensureSync(check.id);

      if (enqueued) {
        recovered += 1;
      }
    }

    return recovered;
  }

}
