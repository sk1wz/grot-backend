import { Controller, Get, Param, Req } from '@nestjs/common';
import { type Request } from 'express';
import { Auth } from '@/auth/decorators';
import { CheckService } from './check.service';
import { BatchService } from '@/batch/batch.service';

@Controller('checks')
export class CheckQueryController {
  public constructor(
    private readonly checkService: CheckService,
    private readonly batchService: BatchService,
  ) {}

  @Auth()
  @Get()
  public getAllChecks(@Req() req: Request) {
    return this.checkService.getAllChecks(req.session.userId!);
  }

  /** Единый источник данных для таблицы истории на фронте. */
  @Auth()
  @Get('overview')
  public async getOverview(@Req() req: Request) {
    const userId = req.session.userId!;
    const [checks, batches] = await Promise.all([
      this.checkService.getAllChecks(userId),
      this.batchService.list(userId),
    ]);
    return [
      ...checks.map((check) => ({ kind: 'check' as const, ...check })),
      ...batches.map((batch) => ({ kind: 'batch' as const, ...batch })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  @Auth()
  @Get(':id')
  public getCheckById(@Req() req: Request, @Param('id') id: string) {
    return this.checkService.getCheckById(req.session.userId!, id);
  }

  @Auth('ADMIN')
  @Get('admin/check/:id')
  public getCheckByIdAdmin(@Param('id') id: string) {
    return this.checkService.getCheckByIdAdmin(id);
  }

  @Auth('ADMIN')
  @Get('admin/:userId')
  public getUserChecksByAdmin(@Param('userId') userId: string) {
    return this.checkService.getAllChecks(userId);
  }
}
