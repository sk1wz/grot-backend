import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { QueueModule } from '@/queue/queue.module';
import { ReportController } from './report.controller';
import { ReportPdfService } from './report-pdf.service';
import { ReportService } from './report.service';
import { ReportTemplateService } from './report-template.service';

@Module({
  imports: [AuthModule, PrismaModule, forwardRef(() => QueueModule)],
  controllers: [ReportController],
  providers: [ReportService, ReportTemplateService, ReportPdfService],
  exports: [ReportService],
})
export class ReportModule {}
