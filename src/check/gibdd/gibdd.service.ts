import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@prisma/__generated__/enums';
import { CheckService } from '../check.service';
import { bodyFromDto } from '../types/check-body.type';
import { GibddDto } from './dto/gibdd.dto';

@Injectable()
export class GibddService {
  public constructor(private readonly checkService: CheckService) {}

  public createSingle(userId: string, dto: GibddDto) {
    return this.checkService.createCheck(
      userId,
      CheckModuleEnums.GIBDD,
      bodyFromDto({ subject: dto.subject }),
    );
  }

  // public createBatchGibdd(userId: string, dto: GibddDto) {
  //   return this.createSingleGibdd(userId, dto);
  // }
}
