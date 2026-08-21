import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type Request } from 'express';
import { Auth } from '@/auth/decorators';
import { BankruptcyService } from './bankruptcy.service';
import { BankruptcyDto } from './dto';

@Controller(['checks/bankruptcy', 'checks/bancrupcy'])
export class BankruptcyController {
  public constructor(private readonly bankruptcyService: BankruptcyService) {}

  @Auth()
  @Get()
  public getAllBankruptcy(@Req() req: Request) {
    return this.bankruptcyService.getAll(req.session.userId!);
  }

  @Auth()
  @Get('batch')
  public getBatches(@Req() req: Request) {
    return this.bankruptcyService.getBatches(req.session.userId!);
  }

  @Auth()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  public createSingle(@Req() req: Request, @Body() dto: BankruptcyDto) {
    return this.bankruptcyService.createSingle(req.session.userId!, dto);
  }

  @Auth()
  @Post('batch')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
  public createBatch(
    @Req() req: Request,
    @UploadedFile() file: { buffer: Buffer } | undefined,
  ) {
    if (!file) throw new BadRequestException('Excel-файл обязателен');
    return this.bankruptcyService.createBatch(req.session.userId!, file.buffer);
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
