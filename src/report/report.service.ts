import { PrismaService } from '@/prisma/prisma.service';
import { ReportQueueService } from '@/queue/report/report-queue.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/__generated__/client';
import {
  CheckStatusEnums,
  ReportStatusEnums,
} from '@prisma/__generated__/enums';
import { createReadStream } from 'fs';
import { ReportPdfService } from './report-pdf.service';
import { saveReportPdf } from './report-storage';
import { ReportTemplateService } from './report-template.service';
import { ReportResponseDto } from './response/report.response';

@Injectable()
export class ReportService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly reportQueueService: ReportQueueService,
    private readonly reportTemplateService: ReportTemplateService,
    private readonly reportPdfService: ReportPdfService,
  ) {}

  public async getReportById(userId: string, reportId: string) {
    const report = await this.getUserReport(userId, reportId);

    return ReportResponseDto.fromReport(report);
  }

  public async createReport(userId: string, checkId: string) {
    const check = await this.prismaService.check.findUnique({
      where: { id: checkId, userId },
    });

    if (!check) {
      throw new NotFoundException('Проверка не найдена');
    }

    if (check.status !== CheckStatusEnums.DONE) {
      throw new BadRequestException(
        'Отчёт можно сформировать только для завершённой проверки',
      );
    }

    if (check.result === null || check.result === undefined) {
      throw new BadRequestException('У проверки нет результата для отчёта');
    }

    const existingReport = await this.prismaService.report.findUnique({
      where: { checkId },
    });

    if (existingReport) {
      return ReportResponseDto.fromReport(existingReport);
    }

    let report;

    try {
      report = await this.prismaService.report.create({
        data: {
          userId,
          checkId,
          status: ReportStatusEnums.REPORT_PENDING,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const duplicate = await this.prismaService.report.findUnique({
          where: { checkId },
        });

        if (duplicate) {
          return ReportResponseDto.fromReport(duplicate);
        }
      }

      throw error;
    }

    try {
      await this.reportQueueService.enqueueGenerate(report.id);
    } catch (error) {
      await this.failReport(report.id, error);

      throw error;
    }

    return ReportResponseDto.fromReport(report);
  }

  public async generateReport(reportId: string): Promise<void> {
    const report = await this.prismaService.report.findUnique({
      where: { id: reportId },
      include: { check: true },
    });

    if (!report || report.status !== ReportStatusEnums.REPORT_PENDING) {
      return;
    }

    await this.prismaService.report.update({
      where: { id: report.id },
      data: { status: ReportStatusEnums.REPORT_PROCESSING },
    });

    try {
      const html = this.reportTemplateService.renderCheckReport(report.check);
      const pdf = await this.reportPdfService.fromHtml(html);
      const filePath = saveReportPdf(report.userId, report.checkId, pdf);

      await this.prismaService.report.update({
        where: { id: report.id },
        data: {
          status: ReportStatusEnums.REPORT_DONE,
          filePath,
          error: Prisma.DbNull,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      await this.failReport(report.id, error);
    }
  }

  public async getReportFile(userId: string, reportId: string) {
    const report = await this.getUserReport(userId, reportId);

    if (report.status !== ReportStatusEnums.REPORT_DONE || !report.filePath) {
      throw new BadRequestException('Отчёт ещё не готов');
    }

    return {
      stream: createReadStream(report.filePath),
      filename: `${report.checkId}.pdf`,
    };
  }

  private async failReport(reportId: string, error: unknown) {
    await this.prismaService.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatusEnums.REPORT_FAILED,
        completedAt: new Date(),
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Ошибка формирования отчёта',
        },
      },
    });
  }

  private async getUserReport(userId: string, reportId: string) {
    const report = await this.prismaService.report.findUnique({
      where: { checkId: reportId, userId },
    });

    if (!report) {
      throw new NotFoundException('Отчёт не найден');
    }

    return report;
  }
}
