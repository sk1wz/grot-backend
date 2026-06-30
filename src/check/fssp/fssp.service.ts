import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@prisma/__generated__/enums';
import { CheckService } from '../check.service';
import { bodyFromDto } from '../types/check-body.type';
import { FsspCheckDto } from './dto/fssp.dto';

@Injectable()
export class FsspService {
  public constructor(private readonly checkService: CheckService) {}

  public createSingle(userId: string, dto: FsspCheckDto) {
    return this.checkService.createCheck(
      userId,
      CheckModuleEnums.FSSP,
      bodyFromDto({ mode: dto.mode, subject: dto.subject }),
    );
  }

  // public createBatchFssp(userId: string, dto: FsspCheckDto) {
  //   return this.createSingleFssp(userId, dto);
  // }
}
