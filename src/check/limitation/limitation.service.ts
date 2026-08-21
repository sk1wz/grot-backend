import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { CheckService } from '../check.service';
import { LimitationDto } from './dto';
import { BatchService } from '@/batch/batch.service';

@Injectable()
export class LimitationService {
  public constructor(
    private readonly checkService: CheckService,
    private readonly batchService: BatchService,
  ) {}

  public createSingle(userId: string, dto: LimitationDto) {
    return this.checkService.createCheck(userId, CheckModuleEnums.LIMITATION, {
      subjectBody: dto.subjectBody,
    });
  }

  public async getAll(userId: string) {
    const [checks, batches] = await Promise.all([
      this.checkService.getChecksByModule(userId, CheckModuleEnums.LIMITATION),
      this.batchService.list(userId, CheckModuleEnums.LIMITATION),
    ]);
    return [
      ...checks.map((check) => ({ kind: 'check' as const, ...check })),
      ...batches.map((batch) => ({ kind: 'batch' as const, ...batch })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /** Шаблон ограничений: первый лист, A1 = VIN, значения в A2:A... */
  public createBatch(userId: string, file: Buffer) {
    return this.batchService.createVinBatch(userId, CheckModuleEnums.LIMITATION, file);
  }
}
