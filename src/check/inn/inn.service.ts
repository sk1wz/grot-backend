import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { CheckService } from '../check.service';
import { InnDto } from './dto';
import { BatchService } from '@/batch/batch.service';

@Injectable()
export class InnService {
  public constructor(
    private readonly checkService: CheckService,
    private readonly batchService: BatchService,
  ) {}

  public createSingle(userId: string, dto: InnDto) {
    return this.checkService.createCheck(userId, CheckModuleEnums.INN, {
      type: dto.type,
      subjectBody: dto.subjectBody,
    });
  }

  public getAll(userId: string) {
    return this.checkService.getChecksByModule(userId, CheckModuleEnums.INN);
  }

  public getBatches(userId: string) {
    return this.batchService.list(userId, CheckModuleEnums.INN);
  }

  public createBatch(userId: string, file: Buffer) {
    return this.batchService.createSpreadsheetBatch(
      userId,
      CheckModuleEnums.INN,
      file,
    );
  }
}
