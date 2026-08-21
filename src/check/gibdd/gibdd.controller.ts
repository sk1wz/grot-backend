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
import { GibddDto } from './dto';
import { GibddService } from './gibdd.service';

@Controller('checks/gibdd')
export class GibddController {
  public constructor(private readonly gibddService: GibddService) {}

  @Auth()
  @Get()
  @HttpCode(HttpStatus.ACCEPTED)
  public getAllGibdd(@Req() req: Request) {
    return this.gibddService.getAll(req.session.userId!);
  }

  @Auth()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  public createSingle(@Req() req: Request, @Body() dto: GibddDto) {
    return this.gibddService.createSingle(req.session.userId!, dto);
  }

  @Auth()
  @Post('batch')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
  public createBatch(@Req() req: Request, @UploadedFile() file: { buffer: Buffer } | undefined) {
    if (!file) throw new BadRequestException('Excel-файл обязателен');
    return this.gibddService.createBatch(req.session.userId!, file.buffer);
  }

}
