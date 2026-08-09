import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { CheckService } from '../check.service';
import { FsspCheckDto } from './dto/fssp.dto';

@Injectable()
export class FsspService {
  public constructor(private readonly checkService: CheckService) {}

  public createSingle(userId: string, dto: FsspCheckDto) {
    return this.checkService.createCheck(
      userId,
      CheckModuleEnums.FSSP,
      { type: dto.type, subjectBody: dto.subjectBody },
    );
  }

  // public createBatchFssp(userId: string, dto: FsspCheckDto) {
  //   return this.createSingleFssp(userId, dto);
  // }
}
