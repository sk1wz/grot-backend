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

  public getAll(userId: string) {
    return this.checkService.getChecksByModule(
      userId,
      CheckModuleEnums.LIMITATION,
    );
  }

  public getBatches(userId: string) {
    return this.batchService.list(userId, CheckModuleEnums.LIMITATION);
  }

  public createBatch(userId: string, file: Buffer, fileName: string) {
    return this.batchService.createSpreadsheetBatch(
      userId,
      CheckModuleEnums.LIMITATION,
      file,
      fileName,
    );
  }
}
