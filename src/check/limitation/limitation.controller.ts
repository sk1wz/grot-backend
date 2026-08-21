import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type Request } from 'express';
import { Auth } from '@/auth/decorators';
import { LimitationDto } from './dto';
import { LimitationService } from './limitation.service';

@Controller('checks/limitation')
export class LimitationController {
  public constructor(private readonly limitationService: LimitationService) {}

  @Auth()
  @Get()
  @HttpCode(HttpStatus.ACCEPTED)
  public getAll(@Req() req: Request) {
    return this.limitationService.getAll(req.session.userId!);
  }

  @Auth()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  public createSingle(@Req() req: Request, @Body() dto: LimitationDto) {
    return this.limitationService.createSingle(req.session.userId!, dto);
  }

  @Auth()
  @Post('batch')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
  public createBatch(@Req() req: Request, @UploadedFile() file: { buffer: Buffer } | undefined) {
    if (!file) throw new BadRequestException('Excel-файл обязателен');
    return this.limitationService.createBatch(req.session.userId!, file.buffer);
  }

}
