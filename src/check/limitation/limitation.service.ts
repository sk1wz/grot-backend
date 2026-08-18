import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { CheckService } from '../check.service';
import { LimitationDto } from './dto';

@Injectable()
export class LimitationService {
  public constructor(private readonly checkService: CheckService) {}

  public createSingle(userId: string, dto: LimitationDto) {
    return this.checkService.createCheck(userId, CheckModuleEnums.LIMITATION, {
      subjectBody: dto.subjectBody,
    });
  }

  public getAll(userId: string) {
    return this.checkService.getChecksByModule(userId, CheckModuleEnums.LIMITATION);
  }
}
