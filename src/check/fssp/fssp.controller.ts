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
  @Get('batch')
  public getBatches(@Req() req: Request) {
    return this.fsspService.getBatches(req.session.userId!);
  }

  @Auth()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  public createSingle(@Req() req: Request, @Body() dto: FsspCheckDto) {
    return this.fsspService.createSingle(req.session.userId!, dto);
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
    return this.fsspService.createBatch(
      req.session.userId!,
      file.buffer,
      file.originalname,
    );
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
