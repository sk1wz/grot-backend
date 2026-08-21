import {
  BadRequestException,
  Injectable,
  NotFoundException,
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
import { CheckQueueService } from '@/queue/check/check-queue.service';
import { getCheckProvider } from '@/check/utils/provider-map';
import { buildSubjectBodyText } from '@/check/utils/subject-body-text';
import { ReportService } from '@/report/report.service';
import { BatchGateway } from './batch.gateway';
import { getCheckModuleLabel } from '@/utils/check-module-label';

type VinRow = { vin: string; sourceRow: number };

@Injectable()
export class BatchService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly balance: BalanceService,
    private readonly checkQueue: CheckQueueService,
    private readonly report: ReportService,
    private readonly gateway: BatchGateway,
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
          action: `Оплата пакетной проверки ${getCheckModuleLabel(module)}`,
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

    const checks = await this.prisma.check.findMany({
      where: { batchId: queued.id },
      select: { id: true },
    });

    await Promise.all(
      checks.map((check) => this.checkQueue.enqueueSubmit(check.id)),
    );
    this.publish(queued);
    return this.toResponse(queued);
  }

  public createVinBatch(
    userId: string,
    module: CheckModuleEnums,
    file: Buffer,
  ) {
    return this.create(userId, module, file);
  }

  public async onCheckCompleted(check: Check): Promise<void> {
    if (!check.batchId) return;
    const batch = await this.prisma.batchCheck.findUnique({
      where: { id: check.batchId },
    });
    if (!batch || batch.completedAt) return;

    const [successfulItems, failedItems] = await Promise.all([
      this.prisma.check.count({
        where: { batchId: batch.id, status: CheckStatusEnums.DONE },
      }),
      this.prisma.check.count({
        where: { batchId: batch.id, status: CheckStatusEnums.FAILED },
      }),
    ]);
    const completed = successfulItems + failedItems === batch.totalItems;

    if (!completed) {
      const updated = await this.prisma.batchCheck.update({
        where: { id: batch.id },
        data: {
          successfulItems,
          failedItems,
          currentChunk: successfulItems + failedItems,
          status: CheckStatusEnums.RUNNING,
        },
      });
      this.publish(updated);
      return;
    }

    const result = await this.prisma.batchCheck.updateMany({
      where: { id: batch.id, completedAt: null },
      data: {
        successfulItems,
        failedItems,
        currentChunk: successfulItems + failedItems,
        status: failedItems ? CheckStatusEnums.FAILED : CheckStatusEnums.DONE,
        completedAt: new Date(),
      },
    });
    if (!result.count) return;

    const completedBatch = await this.prisma.batchCheck.findUniqueOrThrow({
      where: { id: batch.id },
    });
    await this.report.generateBatch(completedBatch);
    this.publish(completedBatch);
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
