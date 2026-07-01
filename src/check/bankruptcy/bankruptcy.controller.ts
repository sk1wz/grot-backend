import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { Auth } from '@/auth/decorators';
import { BankruptcyService } from './bankruptcy.service';
import { BankruptcyDto } from './dto';

@Controller('checks/bankruptcy')
export class BankruptcyController {
  public constructor(private readonly bankruptcyService: BankruptcyService) {}

  @Auth()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  public createSingle(@Req() req: Request, @Body() dto: BankruptcyDto) {
    return this.bankruptcyService.createSingle(req.session.userId!, dto);
  }
}

// @Controller('checks/bankruptcy/batch')
// export class BankruptcyBatchController {
//   public constructor(private readonly bankruptcyService: BankruptcyService) {}

// @Auth()
// @Post()
// @HttpCode(HttpStatus.ACCEPTED)
// public createBatch(@Req() req: Request, @Body() dto: BankruptcyDto) {
//   return this.bankruptcyService.createBatchBankruptcy(req.session.userId!, dto);
// }
// }
