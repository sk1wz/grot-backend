import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { CheckService } from '../check.service';
import { bodyFromDto } from '../types/check-body.type';
import { InnDto } from './dto';

@Injectable()
export class InnService {
  public constructor(private readonly checkService: CheckService) {}

  public createSingle(userId: string, dto: InnDto) {
    return this.checkService.createCheck(
      userId,
      CheckModuleEnums.INN,
      bodyFromDto({ subject: dto.subject }),
    );
  }

  // public createBatchInn(userId: string, dto: InnDto) {
  //   return this.createSingleInn(userId, dto);
  // }
}
