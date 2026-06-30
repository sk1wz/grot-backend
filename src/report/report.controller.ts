import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  StreamableFile,
} from '@nestjs/common';
import { type Request } from 'express';
import { Auth } from '@/auth/decorators/auth.decorator';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
  public constructor(private readonly reportService: ReportService) {}

  @Auth()
  @Get(':id')
  public getReportById(@Req() req: Request, @Param('id') id: string) {
    return this.reportService.getReportById(req.session.userId!, id);
  }

  @Auth()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  public createReport(@Req() req: Request, @Body() dto: CreateReportDto) {
    return this.reportService.createReport(req.session.userId!, dto.checkId);
  }

  @Auth()
  @Get(':id/download')
  public async downloadReport(@Req() req: Request, @Param('id') id: string) {
    const { stream, filename } = await this.reportService.getReportFile(
      req.session.userId!,
      id,
    );

    return new StreamableFile(stream, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}
