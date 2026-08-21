import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { Auth } from '@/auth/decorators';
import { ReportService } from './report.service';

@Controller('checks/report')
export class ReportController {
  public constructor(private readonly reportService: ReportService) {}
  @Auth()
  @Get('excel/:id')
  public async excel(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Param('id') id: string,
  ) {
    const file = await this.reportService.excelForUser(req.session.userId!, id);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="autosintes-report-${id}.xlsx"`,
    });
    return new StreamableFile(file);
  }

  @Auth()
  @Get('batch/:id')
  public async batchExcel(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Param('id') id: string,
  ) {
    const file = await this.reportService.batchExcelForUser(req.session.userId!, id);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="autosintes-batch-report-${id}.xlsx"`,
    });
    return new StreamableFile(file);
  }
}
