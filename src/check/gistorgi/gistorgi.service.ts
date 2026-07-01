import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { GistorgiDto } from './dto';
import { CheckService } from '../check.service';
import { bodyFromDto } from '../types/check-body.type';

@Injectable()
export class GistorgiService {
  public constructor(private readonly checkService: CheckService) {}

  public createSingle(userId: string, dto: GistorgiDto) {
    return this.checkService.createCheck(
      userId,
      CheckModuleEnums.GISTORGI,
      bodyFromDto({ subject: dto.subject }),
    );
  }

  // public createBatchGistorgi(userId: string, dto: GistorgiDto) {
  //   return this.createSingleGistorgi(userId, dto);
  // }
}
