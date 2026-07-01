import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { CheckService } from '../check.service';
import { bodyFromDto } from '../types/check-body.type';
import { BankruptcyDto } from './dto';

@Injectable()
export class BankruptcyService {
  public constructor(private readonly checkService: CheckService) {}

  public createSingle(userId: string, dto: BankruptcyDto) {
    return this.checkService.createCheck(
      userId,
      CheckModuleEnums.BANKRUPTCY,
      bodyFromDto({ subject: dto.subject }),
    );
  }

  // public createBatchBankruptcy(userId: string, dto: BankruptcyDto) {
  //   return this.createSingleBankruptcy(userId, dto);
  // }
}
