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

  public getAll(userId: string) {
    return this.checkService.getChecksByModule(userId, CheckModuleEnums.TAXI);
  }

  public getBatches(userId: string) {
    return this.batchService.list(userId, CheckModuleEnums.TAXI);
  }

  /** Шаблон такси: первый лист, A1 = VIN, значения в A2:A... */
  public createBatch(userId: string, file: Buffer, fileName: string) {
    return this.batchService.createSpreadsheetBatch(
      userId,
      CheckModuleEnums.TAXI,
      file,
      fileName,
    );
  }
}
