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
import { GistorgiService } from './gistorgi.service';
import { GistorgiDto } from './dto';

@Controller('checks/gistorgi')
export class GistorgiController {
  public constructor(private readonly gistorgiService: GistorgiService) {}

  @Auth()
  @Get()
  public getAllGistorgi(@Req() req: Request) {
    return this.gistorgiService.getAll(req.session.userId!);
  }

  @Auth()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  public createSingle(@Req() req: Request, @Body() dto: GistorgiDto) {
    return this.gistorgiService.createSingle(req.session.userId!, dto);
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
    return this.gistorgiService.createBatch(req.session.userId!, file.buffer);
  }
}
