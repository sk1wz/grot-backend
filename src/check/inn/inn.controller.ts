import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { Auth } from '@/auth/decorators';
import { InnDto } from './dto';
import { InnService } from './inn.service';

@Controller('checks/inn')
export class InnController {
  public constructor(private readonly innService: InnService) {}

  @Auth()
  @Get()
  public getAllInn(@Req() req: Request) {
    return this.innService.getAll(req.session.userId!);
  }

  @Auth()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  public createSingle(@Req() req: Request, @Body() dto: InnDto) {
    return this.innService.createSingle(req.session.userId!, dto);
  }
}

// @Controller('checks/inn/batch')
// export class InnBatchController {
//   public constructor(private readonly innService: InnService) {}

// @Auth()
// @Post()
// @HttpCode(HttpStatus.ACCEPTED)
// public createBatch(@Req() req: Request, @Body() dto: InnDto) {
//   return this.innService.createBatchInn(req.session.userId!, dto);
// }
// }
