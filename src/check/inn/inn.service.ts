import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { CheckService } from '../check.service';
import { InnDto } from './dto';

@Injectable()
export class InnService {
  public constructor(private readonly checkService: CheckService) {}

  public createSingle(userId: string, dto: InnDto) {
    return this.checkService.createCheck(
      userId,
      CheckModuleEnums.INN,
      { type: dto.type, subjectBody: dto.subjectBody },
    );
  }

  public getAll(userId: string) {
    return this.checkService.getChecksByModule(userId, CheckModuleEnums.INN);
  }

  // public createBatchInn(userId: string, dto: InnDto) {
  //   return this.createSingleInn(userId, dto);
  // }
}
