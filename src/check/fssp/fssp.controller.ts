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
import { FsspCheckDto } from './dto';
import { FsspService } from './fssp.service';

@Controller('checks/fssp')
export class FsspController {
  public constructor(private readonly fsspService: FsspService) {}

  @Auth()
  @Get()
  public getAllFssp(@Req() req: Request) {
    return this.fsspService.getAll(req.session.userId!);
  }

  @Auth()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  public createSingle(@Req() req: Request, @Body() dto: FsspCheckDto) {
    return this.fsspService.createSingle(req.session.userId!, dto);
  }
}

// @Controller('checks/fssp/batch')
// export class FsspBatchController {
//   public constructor(private readonly fsspService: FsspService) {}

// @Auth()
// @Post()
// @HttpCode(HttpStatus.ACCEPTED)
// public createBatch(@Req() req: Request, @Body() dto: FsspCheckDto) {
//   return this.fsspService.createBatchFssp(req.session.userId!, dto);
// }
// }
