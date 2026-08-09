import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { GistorgiDto } from './dto';
import { CheckService } from '../check.service';

@Injectable()
export class GistorgiService {
  public constructor(private readonly checkService: CheckService) {}

  public createSingle(userId: string, dto: GistorgiDto) {
    return this.checkService.createCheck(
      userId,
      CheckModuleEnums.GISTORGI,
      { subjectBody: dto.subjectBody },
    );
  }

  // public createBatchGistorgi(userId: string, dto: GistorgiDto) {
  //   return this.createSingleGistorgi(userId, dto);
  // }
}
