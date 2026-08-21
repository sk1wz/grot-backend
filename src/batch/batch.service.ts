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
import { toStoredSubjectBody } from '@/check/utils/subject-body';
import { CheckBody } from '@/check/types';
import { ReportService } from '@/report/report.service';
import { BatchGateway } from './batch.gateway';
import { getCheckModuleLabel } from '@/utils/check-module-label';

type BatchItem = { body: CheckBody; sourceRow: number };
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

  public async create(
    userId: string,
    module: CheckModuleEnums,
    file: Buffer,
    subjectBodyText: string,
  ) {
    const rows = await this.readBatchItems(module, file);
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
        data: {
          userId,
          module,
          totalItems: rows.length,
          cost: totalCost,
          subjectBodyText,
        },
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
          subjectBody: toStoredSubjectBody(row.body) as Prisma.InputJsonValue,
          subjectBodyText: buildSubjectBodyText(
            module,
            toStoredSubjectBody(row.body),
          ),
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

  public createSpreadsheetBatch(
    userId: string,
    module: CheckModuleEnums,
    file: Buffer,
    subjectBodyText: string,
  ) {
    return this.create(userId, module, file, subjectBodyText);
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
        // A batch is unsuccessful only when no item produced a result. Failed
        // items are refunded individually by CheckService.failCheck().
        status:
          failedItems === batch.totalItems
            ? CheckStatusEnums.FAILED
            : CheckStatusEnums.DONE,
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

  private async readBatchItems(
    module: CheckModuleEnums,
    file: Buffer,
  ): Promise<BatchItem[]> {
    return readSpreadsheetItems(module, file);
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
      subjectBodyText: batch.subjectBodyText,
      currentChunk: batch.currentChunk,
      createdAt: batch.createdAt,
      completedAt: batch.completedAt,
    };
  }
}

async function readSpreadsheetItems(
  module: CheckModuleEnums,
  file: Buffer,
): Promise<BatchItem[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file as never);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new BadRequestException('В файле отсутствует первый лист');

  const headers = new Map<string, number>();
  for (let column = 1; column <= sheet.columnCount; column += 1) {
    const header = String(sheet.getCell(1, column).text).trim().toUpperCase();
    if (header) headers.set(header, column);
  }

  const items: BatchItem[] = [];
  for (let row = 2; row <= sheet.rowCount; row += 1) {
    items.push(...parseSpreadsheetRow(module, sheet, headers, row));
  }
  if (!items.length)
    throw new BadRequestException('В файле нет данных для проверки');
  return items;
}

function parseSpreadsheetRow(
  module: CheckModuleEnums,
  sheet: ExcelJS.Worksheet,
  headers: Map<string, number>,
  sourceRow: number,
): BatchItem[] {
  const cell = (header: string) => {
    const column = headers.get(header);
    return column === undefined
      ? ''
      : String(sheet.getCell(sourceRow, column).text).trim();
  };
  const dateCell = (header: string) => {
    const column = headers.get(header);
    if (column === undefined) return '';
    const value = sheet.getCell(sourceRow, column).value;
    if (value === null || value === undefined || value === '') return '';
    const normalized = normalizeSpreadsheetDate(value);
    if (normalized) return normalized;
    throw new BadRequestException(
      `Некорректная дата рождения в строке ${sourceRow}. Используйте формат ДД.ММ.ГГГГ`,
    );
  };
  const item = (body: CheckBody): BatchItem => ({ body, sourceRow });

  if (
    module === CheckModuleEnums.GIBDD ||
    module === CheckModuleEnums.TAXI ||
    module === CheckModuleEnums.LIMITATION ||
    module === CheckModuleEnums.GISTORGI
  ) {
    requireHeaders(headers, ['VIN']);
    const vin = cell('VIN').toUpperCase();
    if (!vin) return [];
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin))
      throw new BadRequestException(`Некорректный VIN в строке ${sourceRow}`);
    return [item({ subjectBody: { vin } })];
  }

  if (module === CheckModuleEnums.INN) {
    requireHeaders(headers, ['ФИО', 'ДАТА РОЖДЕНИЯ', 'ПАСПОРТ']);
    const fio = cell('ФИО');
    const dob = dateCell('ДАТА РОЖДЕНИЯ');
    const passport = cell('ПАСПОРТ');
    if (!fio && !dob && !passport) return [];
    if (!fio || !dob || !passport)
      throw new BadRequestException(
        `Заполните ФИО, дату рождения и паспорт в строке ${sourceRow}`,
      );
    return [
      item({ type: 'for_structured', subjectBody: { fio, dob, passport } }),
    ];
  }

  if (module === CheckModuleEnums.BANKRUPTCY) {
    requireAnyHeader(headers, ['ИНН', 'ФИО']);
    return orderedHeaders(headers, ['ИНН', 'ФИО']).flatMap((header) => {
      const value = cell(header);
      if (!value) return [];
      return [
        item(
          header === 'ИНН'
            ? { type: 'for_inn', subjectBody: { inn: value } }
            : { type: 'for_fio', subjectBody: { fio: value } },
        ),
      ];
    });
  }

  if (module === CheckModuleEnums.FSSP) {
    requireAnyHeader(headers, ['ИНН', 'НОМЕР ИП', 'НОМЕР ИЛ', 'ФИО']);
    return orderedHeaders(headers, [
      'ИНН',
      'НОМЕР ИП',
      'НОМЕР ИЛ',
      'ФИО',
    ]).flatMap((header) => {
      const value = cell(header);
      if (!value) return [];
      if (header === 'ИНН') {
        if (!/^(?:\d{10}|\d{12})$/.test(value))
          throw new BadRequestException(
            `Некорректный ИНН в строке ${sourceRow}`,
          );
        return [item({ type: 'for_inn', subjectBody: { inn: value } })];
      }
      if (header === 'НОМЕР ИП')
        return [item({ type: 'for_ip', subjectBody: { ip: value } })];
      if (header === 'НОМЕР ИЛ')
        return [item({ type: 'for_doc_id', subjectBody: { doc_id: value } })];
      const dob = dateCell('ДАТА РОЖДЕНИЯ');
      if (!dob)
        throw new BadRequestException(
          `Для ФИО укажите дату рождения в строке ${sourceRow}`,
        );
      return [item({ type: 'for_fio_dob', subjectBody: { fio: value, dob } })];
    });
  }

  throw new BadRequestException(
    `Пакетный импорт для ${module} не поддерживается`,
  );
}

function requireHeaders(
  headers: Map<string, number>,
  required: string[],
): void {
  const missing = required.filter((header) => !headers.has(header));
  if (missing.length)
    throw new BadRequestException(
      `Отсутствуют заголовки: ${missing.join(', ')}`,
    );
}

function requireAnyHeader(
  headers: Map<string, number>,
  candidates: string[],
): void {
  if (!candidates.some((header) => headers.has(header)))
    throw new BadRequestException(
      `Ожидается хотя бы один заголовок: ${candidates.join(', ')}`,
    );
}

function orderedHeaders(
  headers: Map<string, number>,
  candidates: string[],
): string[] {
  return candidates
    .filter((header) => headers.has(header))
    .sort((left, right) => headers.get(left)! - headers.get(right)!);
}

function normalizeSpreadsheetDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDate(
      value.getUTCFullYear(),
      value.getUTCMonth() + 1,
      value.getUTCDate(),
    );
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    // Excel's day 0 is 1899-12-30 (including its historical leap-year bug).
    const date = new Date(
      Date.UTC(1899, 11, 30) + Math.floor(value) * 86_400_000,
    );
    return formatDate(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
    );
  }

  if (typeof value !== 'string') return null;
  const text = value.trim();
  const match = text.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
  if (match) {
    return formatDate(Number(match[3]), Number(match[2]), Number(match[1]));
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return formatDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

function formatDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
}
