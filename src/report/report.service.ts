import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Check, CheckModuleEnums, CheckStatusEnums } from '@/db';
import { PrismaService } from '@/prisma/prisma.service';
import ExcelJS from 'exceljs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildGibddExcel } from './templates/gibdd/excel.template';
import { buildFsspExcel } from './templates/fssp/excel.template';
import { buildGistorgiExcel } from './templates/gistorgi/excel.template';
import { buildInnExcel } from './templates/inn/excel.template';
import { buildBankruptcyExcel } from './templates/bankruptcy/excel.template';

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
    if (check.module === CheckModuleEnums.INN) buildInnExcel(workbook, check);
    else buildGistorgiExcel(workbook, check);
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private path(id: string): string {
    return join(this.directory, `${id}.xlsx`);
  }
}
