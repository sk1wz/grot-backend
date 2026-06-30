import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { Auth } from '@/auth/decorators/auth.decorator';
import { GibddDto } from './dto/gibdd.dto';
import { GibddService } from './gibdd.service';

@Controller('checks/gibdd')
export class GibddController {
  public constructor(private readonly gibddService: GibddService) {}

  @Auth()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  public createSingle(@Req() req: Request, @Body() dto: GibddDto) {
    return this.gibddService.createSingle(req.session.userId!, dto);
  }
}

// @Controller('checks/gibdd/batch')
// export class GibddBatchController {
//   public constructor(private readonly GibddService: GibddService) {}

// @Auth()
// @Post()
// @HttpCode(HttpStatus.ACCEPTED)
// public createBatch(@Req() req: Request, @Body() dto: GistorgiDto) {
//   return this.GibddService.createBatchGibdd(req.session.userId!, dto);
// }
// }
