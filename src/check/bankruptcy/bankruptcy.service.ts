import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { CheckService } from '../check.service';
import { BankruptcyDto } from './dto';

@Injectable()
export class BankruptcyService {
  public constructor(private readonly checkService: CheckService) {}

  public createSingle(userId: string, dto: BankruptcyDto) {
    return this.checkService.createCheck(
      userId,
      CheckModuleEnums.BANKRUPTCY,
      { type: dto.type, subjectBody: dto.subjectBody },
    );
  }

  // public createBatchBankruptcy(userId: string, dto: BankruptcyDto) {
  //   return this.createSingleBankruptcy(userId, dto);
  // }
}
