import { CheckQueueService } from '@/queue/check/check-queue.service';
import { CHECK_QUEUE_MODULES } from '@/queue/check/check-queue.constants';
import { ReportQueueService } from '@/queue/report/report-queue.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import {
  CheckStatusEnums,
  ReportStatusEnums,
} from '@prisma/__generated__/enums';

@Injectable()
export class QueueRecoveryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(QueueRecoveryService.name);

  public constructor(
    private readonly prismaService: PrismaService,
    private readonly checkQueueService: CheckQueueService,
    private readonly reportQueueService: ReportQueueService,
  ) {}

  public onApplicationBootstrap(): void {
    void this.recoverOnStartup();
  }

  private async recoverOnStartup(): Promise<void> {
    const [submitRecovered, syncRecovered, reportsRecovered] =
      await Promise.all([
        this.recoverPendingSubmits(),
        this.recoverActiveSyncs(),
        this.recoverPendingReports(),
      ]);

    const total = submitRecovered + syncRecovered + reportsRecovered;

    if (total === 0) {
      this.logger.log('Startup queue recovery: nothing to recover');
      return;
    }

    this.logger.log(
      `Startup queue recovery: ${submitRecovered} submit, ${syncRecovered} sync, ${reportsRecovered} report jobs re-enqueued`,
    );
  }

  private async recoverPendingSubmits(): Promise<number> {
    const checks = await this.prismaService.check.findMany({
      where: {
        status: CheckStatusEnums.PENDING,
        serviceId: null,
        module: { in: [...CHECK_QUEUE_MODULES] },
      },
      select: { id: true, module: true },
    });

    let recovered = 0;

    for (const check of checks) {
      const enqueued = await this.checkQueueService.ensureSubmit(
        check.module,
        check.id,
      );

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
      select: { id: true, module: true },
    });

    let recovered = 0;

    for (const check of checks) {
      const enqueued = await this.checkQueueService.ensureSync(
        check.module,
        check.id,
      );

      if (enqueued) {
        recovered += 1;
      }
    }

    return recovered;
  }

  private async recoverPendingReports(): Promise<number> {
    const reports = await this.prismaService.report.findMany({
      where: {
        status: {
          in: [
            ReportStatusEnums.REPORT_PENDING,
            ReportStatusEnums.REPORT_PROCESSING,
          ],
        },
      },
      select: { id: true },
    });

    let recovered = 0;

    for (const report of reports) {
      const enqueued = await this.reportQueueService.ensureGenerate(report.id);

      if (enqueued) {
        recovered += 1;
      }
    }

    return recovered;
  }
}
