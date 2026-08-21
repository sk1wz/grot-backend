import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BatchCheck, Check, CheckModuleEnums, CheckStatusEnums } from '@/db';
import { PrismaService } from '@/prisma/prisma.service';
import ExcelJS from 'exceljs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildGibddExcel } from './templates/gibdd/excel.template';
import { buildFsspExcel } from './templates/fssp/excel.template';
import { buildGistorgiExcel } from './templates/gistorgi/excel.template';
import { buildInnExcel } from './templates/inn/excel.template';
import { buildBankruptcyExcel } from './templates/bankruptcy/excel.template';
import { buildLimitationExcel } from './templates/limitation/excel.template';
import { buildTaxiExcel } from './templates/taxi/excel.template';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private readonly directory =
    process.env.REPORT_STORAGE_PATH ??
    join(process.cwd(), 'storage', 'reports');

  public constructor(private readonly prisma: PrismaService) {}

  public async generate(check: Check): Promise<void> {
    if (check.status !== CheckStatusEnums.DONE) return;
    await mkdir(this.directory, { recursive: true });
    await writeFile(this.path(check.id), await this.renderExcel(check));
    this.logger.log(`Excel report generated for check ${check.id}`);
  }

  private async generateBatchLegacy(batch: BatchCheck): Promise<void> {
    const checks = await this.prisma.check.findMany({
      where: { batchId: batch.id },
      orderBy: { batchPosition: 'asc' },
    });
    await mkdir(this.directory, { recursive: true });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Результаты');
    sheet.addRow(['Строка', 'VIN', 'Статус', 'Результат', 'Ошибка']);
    checks.forEach((check) => {
      const body = check.subjectBody as Record<string, unknown>;
      sheet.addRow([
        check.sourceRow ?? '',
        typeof body.vin === 'string' ? body.vin : '',
        check.status,
        check.result ? JSON.stringify(check.result) : '',
        check.error ? JSON.stringify(check.error) : '',
      ]);
    });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = {
      from: 'A1',
      to: { row: Math.max(sheet.rowCount, 1), column: 5 },
    };
    sheet.getRow(1).font = { bold: true };
    [12, 22, 24, 80, 50].forEach((width, index) => {
      sheet.getColumn(index + 1).width = width;
      sheet.getColumn(index + 1).alignment = {
        vertical: 'top',
        wrapText: true,
      };
    });
    await writeFile(
      this.batchPath(batch.id),
      Buffer.from(await workbook.xlsx.writeBuffer()),
    );
  }

  /** Combines same-module check results into filterable tables with one header. */
  public async generateBatch(batch: BatchCheck): Promise<void> {
    const checks = await this.prisma.check.findMany({
      where: { batchId: batch.id },
      orderBy: { batchPosition: 'asc' },
    });
    const workbook = new ExcelJS.Workbook();

    const failedChecks: Check[] = [];
    for (const check of checks) {
      if (check.status === CheckStatusEnums.FAILED) {
        failedChecks.push(check);
        continue;
      }
      const singleWorkbook = new ExcelJS.Workbook();
      await singleWorkbook.xlsx.load((await this.renderExcel(check)) as never);
      this.appendCheckRows(workbook, singleWorkbook, check);
    }
    this.appendFailedRows(workbook, failedChecks);
    this.formatBatchSheets(workbook);

    await mkdir(this.directory, { recursive: true });
    await writeFile(
      this.batchPath(batch.id),
      Buffer.from(await workbook.xlsx.writeBuffer()),
    );
  }

  public async batchExcelForUser(userId: string, id: string): Promise<Buffer> {
    const batch = await this.prisma.batchCheck.findUnique({
      where: { id, userId },
    });
    if (!batch) throw new NotFoundException('Пакетная проверка не найдена');
    if (!batch.completedAt) throw new NotFoundException('Отчёт ещё не готов');
    try {
      return await readFile(this.batchPath(id));
    } catch {
      await this.generateBatch(batch);
      return readFile(this.batchPath(id));
    }
  }

  public async excelForUser(userId: string, id: string): Promise<Buffer> {
    const check = await this.prisma.check.findUnique({ where: { id, userId } });
    if (!check) throw new NotFoundException('Проверка не найдена');
    if (check.status !== CheckStatusEnums.DONE)
      throw new NotFoundException('Отчёт ещё не готов');
    try {
      return await readFile(this.path(id));
    } catch {
      await this.generate(check);
      return readFile(this.path(id));
    }
  }

  private async renderExcel(check: Check): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    if (check.module === CheckModuleEnums.GIBDD) {
      buildGibddExcel(workbook, check);
      return Buffer.from(await workbook.xlsx.writeBuffer());
    }
    if (check.module === CheckModuleEnums.FSSP) {
      buildFsspExcel(workbook, check);
      return Buffer.from(await workbook.xlsx.writeBuffer());
    }
    if (check.module === CheckModuleEnums.BANKRUPTCY) {
      buildBankruptcyExcel(workbook, check);
      return Buffer.from(await workbook.xlsx.writeBuffer());
    }
    if (check.module === CheckModuleEnums.LIMITATION) {
      buildLimitationExcel(workbook, check);
      return Buffer.from(await workbook.xlsx.writeBuffer());
    }
    if (check.module === CheckModuleEnums.TAXI) {
      buildTaxiExcel(workbook, check);
      return Buffer.from(await workbook.xlsx.writeBuffer());
    }
    if (check.module === CheckModuleEnums.INN) buildInnExcel(workbook, check);
    else buildGistorgiExcel(workbook, check);
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private appendCheckRows(
    batchWorkbook: ExcelJS.Workbook,
    singleWorkbook: ExcelJS.Workbook,
    check: Check,
  ): void {
    for (const source of singleWorkbook.worksheets) {
      let target = batchWorkbook.getWorksheet(source.name);
      if (!target) target = batchWorkbook.addWorksheet(source.name);
      const headerColumns = this.ensureBatchHeaders(target, source);
      const hasData = source.rowCount > 1;

      for (let rowNumber = 2; rowNumber <= source.rowCount; rowNumber += 1) {
        const sourceRow = source.getRow(rowNumber);
        const targetRow = target.addRow([check.status]);
        targetRow.height = sourceRow.height;
        sourceRow.eachCell(
          { includeEmpty: true },
          (sourceCell, columnNumber) => {
            const targetColumn = headerColumns.get(columnNumber);
            if (!targetColumn) return;
            const targetCell = targetRow.getCell(targetColumn);
            targetCell.value = sourceCell.value;
            targetCell.style = { ...sourceCell.style };
          },
        );
      }

      // A successful check with no provider records still has a visible row.
      if (!hasData) target.addRow([check.status]);
    }
  }

  private ensureBatchHeaders(
    target: ExcelJS.Worksheet,
    source: ExcelJS.Worksheet,
  ): Map<number, number> {
    const targetHeaders = new Map<string, number>();
    if (target.rowCount === 0) {
      target.addRow([
        'Статус проверки',
        ...Array.from({ length: source.columnCount }, (_, index) =>
          this.headerOf(source, index + 1),
        ),
      ]);
      target.getColumn(1).width = 20;
      target.getColumn(1).alignment = { vertical: 'top', wrapText: true };
    }

    for (let column = 1; column <= target.columnCount; column += 1) {
      targetHeaders.set(this.headerOf(target, column), column);
    }

    const headerColumns = new Map<number, number>();
    for (let column = 1; column <= source.columnCount; column += 1) {
      const header = this.headerOf(source, column);
      let targetColumn = targetHeaders.get(header);
      if (!targetColumn) {
        targetColumn = target.columnCount + 1;
        target.getRow(1).getCell(targetColumn).value = header;
        targetHeaders.set(header, targetColumn);
      }
      headerColumns.set(column, targetColumn);
      const sourceColumn = source.getColumn(column);
      const targetColumnDefinition = target.getColumn(targetColumn);
      targetColumnDefinition.width = Math.max(
        targetColumnDefinition.width ?? 0,
        sourceColumn.width ?? 0,
      );
      targetColumnDefinition.alignment = {
        vertical: 'top',
        wrapText: true,
      };
    }
    return headerColumns;
  }

  private appendFailedRows(workbook: ExcelJS.Workbook, checks: Check[]): void {
    if (!checks.length) return;
    const sheets = workbook.worksheets.length
      ? workbook.worksheets
      : [workbook.addWorksheet('Результаты')];
    if (sheets[0].rowCount === 0) sheets[0].addRow(['Статус проверки']);
    for (const sheet of sheets) {
      checks.forEach(() => sheet.addRow([CheckStatusEnums.FAILED]));
    }
  }

  private formatBatchSheets(workbook: ExcelJS.Workbook): void {
    for (const sheet of workbook.worksheets) {
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
      sheet.autoFilter = {
        from: 'A1',
        to: { row: Math.max(sheet.rowCount, 1), column: sheet.columnCount },
      };
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC9D5E5' },
      };
    }
  }

  private headerOf(sheet: ExcelJS.Worksheet, column: number): string {
    return sheet.getCell(1, column).text || `Колонка ${column}`;
  }

  private appendSingleReport(
    batchWorkbook: ExcelJS.Workbook,
    singleWorkbook: ExcelJS.Workbook,
    check: Check,
    number: number,
  ): void {
    const vin = this.vinOf(check);
    for (const source of singleWorkbook.worksheets) {
      let target = batchWorkbook.getWorksheet(source.name);
      if (!target) target = batchWorkbook.addWorksheet(source.name);
      if (target.rowCount > 0) target.addRow([]);

      const title = target.addRow([
        `Проверка ${number}${vin ? ` · VIN: ${vin}` : ''} · ${check.status}`,
      ]);
      title.font = { bold: true };
      title.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9EAF7' },
      };

      for (let rowNumber = 1; rowNumber <= source.rowCount; rowNumber += 1) {
        const sourceRow = source.getRow(rowNumber);
        const values = Array.isArray(sourceRow.values)
          ? sourceRow.values.slice(1)
          : [];
        const targetRow = target.addRow(values);
        targetRow.height = sourceRow.height;
        sourceRow.eachCell(
          { includeEmpty: true },
          (sourceCell, columnNumber) => {
            targetRow.getCell(columnNumber).style = { ...sourceCell.style };
          },
        );
      }
      source.columns.forEach((column, index) => {
        const targetColumn = target.getColumn(index + 1);
        targetColumn.width = Math.max(
          targetColumn.width ?? 0,
          column.width ?? 0,
        );
      });
    }
  }

  /** Failed checks do not have provider data for a module-specific template. */
  private appendFailedCheck(
    workbook: ExcelJS.Workbook,
    check: Check,
    number: number,
  ): void {
    const sheet =
      workbook.getWorksheet('Ошибки') ?? workbook.addWorksheet('Ошибки');
    if (sheet.rowCount === 0) {
      sheet.addRow(['Проверка', 'Строка', 'Данные', 'Ошибка']);
      sheet.getRow(1).font = { bold: true };
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
      [14, 12, 45, 70].forEach((width, index) => {
        sheet.getColumn(index + 1).width = width;
        sheet.getColumn(index + 1).alignment = {
          vertical: 'top',
          wrapText: true,
        };
      });
    }

    sheet.addRow([
      number,
      check.sourceRow ?? '',
      check.subjectBodyText,
      JSON.stringify(check.error ?? check.result ?? {}),
    ]);
  }

  private vinOf(check: Check): string {
    const body = check.subjectBody;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return '';
    const vin = (body as Record<string, unknown>).vin;
    return typeof vin === 'string' ? vin : '';
  }

  private path(id: string): string {
    return join(this.directory, `${id}.xlsx`);
  }

  private batchPath(id: string): string {
    return join(this.directory, `batch-${id}.xlsx`);
  }
}
