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
  @Get('batch')
  public getBatches(@Req() req: Request) {
    return this.innService.getBatches(req.session.userId!);
  }

  @Auth()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  public createSingle(@Req() req: Request, @Body() dto: InnDto) {
    return this.innService.createSingle(req.session.userId!, dto);
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
    return this.innService.createBatch(
      req.session.userId!,
      file.buffer,
      file.originalname,
    );
  }
}
