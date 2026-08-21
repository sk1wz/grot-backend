import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { CheckService } from '../check.service';
import { FsspCheckDto } from './dto/fssp.dto';
import { BatchService } from '@/batch/batch.service';

@Injectable()
export class FsspService {
  public constructor(
    private readonly checkService: CheckService,
    private readonly batchService: BatchService,
  ) {}

  public createSingle(userId: string, dto: FsspCheckDto) {
    return this.checkService.createCheck(userId, CheckModuleEnums.FSSP, {
      type: dto.type,
      subjectBody: dto.subjectBody,
    });
  }

  public getAll(userId: string) {
    return this.checkService.getChecksByModule(userId, CheckModuleEnums.FSSP);
  }

  public getBatches(userId: string) {
    return this.batchService.list(userId, CheckModuleEnums.FSSP);
  }

  public createBatch(userId: string, file: Buffer, fileName: string) {
    return this.batchService.createSpreadsheetBatch(
      userId,
      CheckModuleEnums.FSSP,
      file,
      fileName,
    );
  }
}
