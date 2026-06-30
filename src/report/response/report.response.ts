import { Report } from '@prisma/__generated__/client';
import { ReportStatusEnums } from '@prisma/__generated__/enums';

export type ReportResponse = {
  id: string;
  checkId: string;
  status: ReportStatusEnums;
  error: unknown;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

export class ReportResponseDto {
  public static fromReport(report: Report): ReportResponse {
    return {
      id: report.id,
      checkId: report.checkId,
      status: report.status,
      error: report.error,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      completedAt: report.completedAt,
    };
  }
}
