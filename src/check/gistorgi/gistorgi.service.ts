import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { GistorgiDto } from './dto';
import { CheckService } from '../check.service';
import { BatchService } from '@/batch/batch.service';

@Injectable()
export class GistorgiService {
  public constructor(
    private readonly checkService: CheckService,
    private readonly batchService: BatchService,
  ) {}

  public createSingle(userId: string, dto: GistorgiDto) {
    const body = { subjectBody: dto.subjectBody };

    return this.checkService.createCheck(
      userId,
      CheckModuleEnums.GISTORGI,
      body,
    );
  }

  public async getAll(userId: string) {
    const [checks, batches] = await Promise.all([
      this.checkService.getChecksByModule(userId, CheckModuleEnums.GISTORGI),
      this.batchService.list(userId, CheckModuleEnums.GISTORGI),
    ]);
    return [
      ...checks.map((check) => ({ kind: 'check' as const, ...check })),
      ...batches.map((batch) => ({ kind: 'batch' as const, ...batch })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /** Шаблон ГИС Торги: первый лист, A1 = VIN, значения в A2:A... */
  public createBatch(userId: string, file: Buffer) {
    return this.batchService.createVinBatch(
      userId,
      CheckModuleEnums.GISTORGI,
      file,
    );
  }
}
