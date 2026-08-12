import { Injectable } from '@nestjs/common';
import { CheckModuleEnums } from '@/db';
import { GistorgiDto } from './dto';
import { CheckService } from '../check.service';

@Injectable()
export class GistorgiService {
  public constructor(private readonly checkService: CheckService) {}

  public createSingle(userId: string, dto: GistorgiDto) {
    const body = { subjectBody: dto.subjectBody };

    return this.checkService.createCheck(
      userId,
      CheckModuleEnums.GISTORGI,
      body,
    );
  }

  public getAll(userId: string) {
    return this.checkService.getChecksByModule(
      userId,
      CheckModuleEnums.GISTORGI,
    );
  }

  // public createBatchGistorgi(userId: string, dto: GistorgiDto) {
  //   return this.createSingleGistorgi(userId, dto);
  // }
}
