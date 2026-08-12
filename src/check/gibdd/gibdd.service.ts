import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { CheckService } from '../check.service';
import { GibddDto } from './dto';

@Injectable()
export class GibddService {
  public constructor(private readonly checkService: CheckService) {}

  public createSingle(userId: string, dto: GibddDto) {
    return this.checkService.createCheck(
      userId,
      CheckModuleEnums.GIBDD,
      { subjectBody: dto.subjectBody },
    );
  }

  public getAll(userId: string) {
    return this.checkService.getChecksByModule(userId, CheckModuleEnums.GIBDD);
  }

  // public createBatchGibdd(userId: string, dto: GibddDto) {
  //   return this.createSingleGibdd(userId, dto);
  // }
}
