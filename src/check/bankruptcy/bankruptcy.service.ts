import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { CheckService } from '../check.service';
import { BankruptcyDto } from './dto';
import { BatchService } from '@/batch/batch.service';

@Injectable()
export class BankruptcyService {
  public constructor(
    private readonly checkService: CheckService,
    private readonly batchService: BatchService,
  ) {}

  public createSingle(userId: string, dto: BankruptcyDto) {
    return this.checkService.createCheck(userId, CheckModuleEnums.BANKRUPTCY, {
      type: dto.type,
      subjectBody: dto.subjectBody,
    });
  }

  public getAll(userId: string) {
    return this.checkService.getChecksByModule(
      userId,
      CheckModuleEnums.BANKRUPTCY,
    );
  }

  public getBatches(userId: string) {
    return this.batchService.list(userId, CheckModuleEnums.BANKRUPTCY);
  }

  public createBatch(userId: string, file: Buffer, fileName: string) {
    return this.batchService.createSpreadsheetBatch(
      userId,
      CheckModuleEnums.BANKRUPTCY,
      file,
      fileName,
    );
  }
}
