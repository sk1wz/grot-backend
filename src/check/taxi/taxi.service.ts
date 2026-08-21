import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { CheckService } from '../check.service';
import { TaxiDto } from './dto';
import { BatchService } from '@/batch/batch.service';

@Injectable()
export class TaxiService {
  public constructor(
    private readonly checkService: CheckService,
    private readonly batchService: BatchService,
  ) {}

  public createSingle(userId: string, dto: TaxiDto) {
    return this.checkService.createCheck(userId, CheckModuleEnums.TAXI, {
      subjectBody: dto.subjectBody,
    });
  }

  public async getAll(userId: string) {
    const [checks, batches] = await Promise.all([
      this.checkService.getChecksByModule(userId, CheckModuleEnums.TAXI),
      this.batchService.list(userId, CheckModuleEnums.TAXI),
    ]);
    return [
      ...checks.map((check) => ({ kind: 'check' as const, ...check })),
      ...batches.map((batch) => ({ kind: 'batch' as const, ...batch })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /** Шаблон такси: первый лист, A1 = VIN, значения в A2:A... */
  public createBatch(userId: string, file: Buffer) {
    return this.batchService.createVinBatch(
      userId,
      CheckModuleEnums.TAXI,
      file,
    );
  }
}
