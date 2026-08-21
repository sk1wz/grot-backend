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

  public getAll(userId: string) {
    return this.checkService.getChecksByModule(
      userId,
      CheckModuleEnums.GISTORGI,
    );
  }

  public getBatches(userId: string) {
    return this.batchService.list(userId, CheckModuleEnums.GISTORGI);
  }

  public createBatch(userId: string, file: Buffer, fileName: string) {
    return this.batchService.createSpreadsheetBatch(
      userId,
      CheckModuleEnums.GISTORGI,
      file,
      fileName,
    );
  }
}
