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
    return this.checkService.createCheck(userId, CheckModuleEnums.GIBDD, {
      subjectBody: dto.subjectBody,
    });
  }

  public getAll(userId: string) {
    return this.checkService.getChecksByModule(userId, CheckModuleEnums.GIBDD);
  }

  public getBatches(userId: string) {
    return this.batchService.list(userId, CheckModuleEnums.GIBDD);
  }
  /** Шаблон ГИБДД: первый лист, A1 = VIN, значения в A2:A... */
  public createBatch(userId: string, file: Buffer) {
    return this.batchService.createVinBatch(
      userId,
      CheckModuleEnums.GIBDD,
      file,
    );
  }
}
