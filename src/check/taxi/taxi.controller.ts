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
import { TaxiDto } from './dto';
import { TaxiService } from './taxi.service';

@Controller('checks/taxi')
export class TaxiController {
  public constructor(private readonly taxiService: TaxiService) {}

  @Auth()
  @Get()
  @HttpCode(HttpStatus.ACCEPTED)
  public getAllTaxi(@Req() req: Request) {
    return this.taxiService.getAll(req.session.userId!);
  }

  @Auth()
  @Get('batch')
  public getBatches(@Req() req: Request) {
    return this.taxiService.getBatches(req.session.userId!);
  }

  @Auth()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  public createSingle(@Req() req: Request, @Body() dto: TaxiDto) {
    return this.taxiService.createSingle(req.session.userId!, dto);
  }

  @Auth()
  @Post('batch')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
  public createBatch(
    @Req() req: Request,
    @UploadedFile() file: { buffer: Buffer; originalname: string } | undefined,
  ) {
    if (!file) throw new BadRequestException('Excel-файл обязателен');
    return this.taxiService.createBatch(
      req.session.userId!,
      file.buffer,
      file.originalname,
    );
  }
}
