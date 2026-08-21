import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import ExcelJS from 'exceljs';
import { randomUUID } from 'node:crypto';
import {
  BatchCheck,
  BalanceStatusEnums,
  Check,
  CheckModuleEnums,
  CheckStatusEnums,
  Prisma,
} from '@/db';
import { PrismaService } from '@/prisma/prisma.service';
import { BalanceService } from '@/balance/balance.service';
import { BatchQueueService } from '@/queue/batch/batch-queue.service';
import { CheckService } from '@/check/check.service';
import { getCheckProvider } from '@/check/utils/provider-map';
import { buildSubjectBodyText } from '@/check/utils/subject-body-text';
import { ReportService } from '@/report/report.service';
import { BatchGateway } from './batch.gateway';

type VinRow = { vin: string; sourceRow: number };

@Injectable()
export class BatchService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly balance: BalanceService,
    private readonly batchQueue: BatchQueueService,
    private readonly report: ReportService,
    private readonly gateway: BatchGateway,
    @Inject(forwardRef(() => CheckService))
    private readonly checkService: CheckService,
  ) {}

  public async create(userId: string, module: CheckModuleEnums, file: Buffer) {
    const rows = await this.readVins(file);
    const price = await this.prisma.checkPrice.findUnique({
      where: { module },
    });
    if (!price)
      throw new BadRequestException('Цена для данного модуля не настроена');
    const totalCost = price.price * rows.length;
    const batch = await this.prisma.$transaction(async (tx) => {
      await this.balance.debit(
        userId,
        totalCost,
        BalanceStatusEnums.BALANCE_PURCHASE,
        {
          action: `Оплата пакетной проверки ${module}`,
        },
        tx,
      );
      const created = await tx.batchCheck.create({
        data: { userId, module, totalItems: rows.length, cost: totalCost },
      });
      await tx.check.createMany({
        data: rows.map((row, batchPosition) => ({
          userId,
          batchId: created.id,
          batchPosition,
          sourceRow: row.sourceRow,
          module,
          provider: getCheckProvider(module),
          status: CheckStatusEnums.PENDING,
          cost: price.price,
          subjectBody: { vin: row.vin } as Prisma.InputJsonValue,
          subjectBodyText: buildSubjectBodyText(module, { vin: row.vin }),
          idempotencyKey: randomUUID(),
        })),
      });
      return created;
    });
    const queued = await this.prisma.batchCheck.update({
      where: { id: batch.id },
      data: { status: CheckStatusEnums.QUEUED },
    });
    await this.batchQueue.enqueue(queued.id, module);
    this.publish(queued);
    return this.toResponse(queued);
  }

  /** VIN-шаблон задаётся конкретным модулем в его сервисе. */
  public createVinBatch(
    userId: string,
    module: CheckModuleEnums,
    file: Buffer,
  ) {
    return this.create(userId, module, file);
  }

  /**
   * Owns the complete lifetime of a batch. The batch worker must stay active
   * while it submits and polls every child, so batch checks never enter the
   * shared queue used by single checks.
   */
  public async processBatch(batchId: string): Promise<void> {
    const batch = await this.prisma.batchCheck.findUnique({
      where: { id: batchId },
    });
    if (
      !batch ||
      !(<CheckStatusEnums[]>[
        CheckStatusEnums.PENDING,
        CheckStatusEnums.QUEUED,
        CheckStatusEnums.RUNNING,
      ]).includes(batch.status)
    )
      return;
    let currentBatch = await this.prisma.batchCheck.update({
      where: { id: batchId },
      data: { status: CheckStatusEnums.RUNNING },
    });
    this.publish(currentBatch);

    while (true) {
      const check = await this.prisma.check.findFirst({
        where: {
          batchId,
          status: { in: [CheckStatusEnums.PENDING, CheckStatusEnums.QUEUED, CheckStatusEnums.RUNNING] },
        },
        orderBy: { batchPosition: 'asc' },
      });
      if (!check) break;

      await this.processOneBatchCheck(check.id);
      currentBatch = await this.prisma.batchCheck.update({
        where: { id: batchId },
        data: { currentChunk: { increment: 1 } },
      });
      await this.refreshProgress(currentBatch);
    }

    await this.complete(currentBatch);
  }

  /** The batch worker itself waits; this callback is intentionally a no-op. */
  public async onCheckCompleted(_check: Check): Promise<void> {}

  private async processOneBatchCheck(checkId: string): Promise<void> {
    while (true) {
      const check = await this.prisma.check.findUnique({ where: { id: checkId } });
      if (!check || this.isTerminal(check.status)) return;

      if (check.status === CheckStatusEnums.PENDING && !check.serviceId) {
        await this.checkService.processSubmit(check.id, { scheduleSync: false });
      } else {
        await this.checkService.processSync(check.id, { scheduleSync: false });
      }

      const updated = await this.prisma.check.findUnique({ where: { id: checkId } });
      if (!updated || this.isTerminal(updated.status)) return;
      await new Promise<void>((resolve) => setTimeout(resolve, 5_000));
    }
  }

  private isTerminal(status: CheckStatusEnums): boolean {
    return status === CheckStatusEnums.DONE || status === CheckStatusEnums.FAILED;
  }

  private async refreshProgress(batch: BatchCheck): Promise<void> {
    const [successfulItems, failedItems] = await Promise.all([
      this.prisma.check.count({ where: { batchId: batch.id, status: CheckStatusEnums.DONE } }),
      this.prisma.check.count({ where: { batchId: batch.id, status: CheckStatusEnums.FAILED } }),
    ]);
    const updated = await this.prisma.batchCheck.update({
      where: { id: batch.id },
      data: { successfulItems, failedItems },
    });
    this.publish(updated);
  }

  public async list(userId: string, module?: CheckModuleEnums) {
    return (
      await this.prisma.batchCheck.findMany({
        where: { userId, ...(module ? { module } : {}) },
        orderBy: { createdAt: 'desc' },
      })
    ).map((batch) => this.toResponse(batch));
  }
  public async get(userId: string, id: string, module?: CheckModuleEnums) {
    const batch = await this.prisma.batchCheck.findFirst({
      where: { id, userId, ...(module ? { module } : {}) },
      include: { checks: { orderBy: { batchPosition: 'asc' } } },
    });
    if (!batch) throw new NotFoundException('Пакетная проверка не найдена');
    return {
      ...this.toResponse(batch),
      checks: batch.checks.map((check) => ({
        id: check.id,
        sourceRow: check.sourceRow,
        subjectBody: check.subjectBody,
        status: check.status,
        result: check.result,
        error: check.error,
      })),
    };
  }

  private async complete(batch: BatchCheck): Promise<void> {
    const [successfulItems, failedItems] = await Promise.all([
      this.prisma.check.count({
        where: { batchId: batch.id, status: CheckStatusEnums.DONE },
      }),
      this.prisma.check.count({
        where: { batchId: batch.id, status: CheckStatusEnums.FAILED },
      }),
    ]);
    const finished = await this.prisma.batchCheck.update({
      where: { id: batch.id },
      data: {
        successfulItems,
        failedItems,
        status: failedItems ? CheckStatusEnums.FAILED : CheckStatusEnums.DONE,
        completedAt: new Date(),
      },
    });
    await this.report.generateBatch(finished);
    this.publish(finished);
  }

  private async readVins(file: Buffer): Promise<VinRow[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file as never);
    const sheet = workbook.worksheets[0];
    if (
      !sheet ||
      String(sheet.getCell('A1').text).trim().toUpperCase() !== 'VIN'
    ) {
      throw new BadRequestException(
        'В первой ячейке первого листа должен быть заголовок VIN',
      );
    }

    const rows: VinRow[] = [];
    const seen = new Set<string>();
    for (let row = 2; row <= sheet.rowCount; row += 1) {
      const vin = String(sheet.getCell(row, 1).text).trim().toUpperCase();
      if (!vin) continue;
      if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin))
        throw new BadRequestException(`Некорректный VIN в строке ${row}`);
      if (seen.has(vin))
        throw new BadRequestException(`Повторяющийся VIN в строке ${row}`);
      seen.add(vin);
      rows.push({ vin, sourceRow: row });
    }
    if (!rows.length)
      throw new BadRequestException('В файле нет VIN для проверки');
    return rows;
  }

  private async publishById(id: string): Promise<void> {
    const batch = await this.prisma.batchCheck.findUnique({ where: { id } });
    if (batch) this.publish(batch);
  }
  private publish(batch: BatchCheck): void {
    this.gateway.emitUpdated(batch.userId, this.toResponse(batch));
  }
  private toResponse(batch: BatchCheck) {
    return {
      id: batch.id,
      module: batch.module,
      status: batch.status,
      totalItems: batch.totalItems,
      successfulItems: batch.successfulItems,
      failedItems: batch.failedItems,
      cost: batch.cost,
      currentChunk: batch.currentChunk,
      createdAt: batch.createdAt,
      completedAt: batch.completedAt,
    };
  }
}
