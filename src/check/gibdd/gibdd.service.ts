import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { CheckService } from '../check.service';
import { GibddDto } from './dto';
import { BatchService } from '@/batch/batch.service';

@Injectable()
export class GibddService {
  public constructor(
    private readonly checkService: CheckService,
    private readonly batchService: BatchService,
  ) {}

  public createSingle(userId: string, dto: GibddDto) {
    return this.checkService.createCheck(
      userId,
      CheckModuleEnums.GIBDD,
      { subjectBody: dto.subjectBody },
    );
  }

  public async getAll(userId: string) {
    const [checks, batches] = await Promise.all([
      this.checkService.getChecksByModule(userId, CheckModuleEnums.GIBDD),
      this.batchService.list(userId, CheckModuleEnums.GIBDD),
    ]);
    return [
      ...checks.map((check) => ({ kind: 'check' as const, ...check })),
      ...batches.map((batch) => ({ kind: 'batch' as const, ...batch })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /** Шаблон ГИБДД: первый лист, A1 = VIN, значения в A2:A... */
  public createBatch(userId: string, file: Buffer) {
    return this.batchService.createVinBatch(userId, CheckModuleEnums.GIBDD, file);
  }

}
