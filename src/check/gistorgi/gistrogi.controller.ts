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
import { GistorgiService } from './gistorgi.service';
import { GistorgiDto } from './dto/gistorgi.dto';

@Controller('checks/gistorgi')
export class GistorgiController {
  public constructor(private readonly gistorgiService: GistorgiService) {}

  @Auth()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  public createSingle(@Req() req: Request, @Body() dto: GistorgiDto) {
    return this.gistorgiService.createSingle(req.session.userId!, dto);
  }
}

// @Controller('checks/gistorgi/batch')
// export class GistorgiBatchController {
//   public constructor(private readonly gistorgiService: GistorgiService) {}

// @Auth()
// @Post()
// @HttpCode(HttpStatus.ACCEPTED)
// public createBatch(@Req() req: Request, @Body() dto: GistorgiDto) {
//   return this.gistorgiService.createBatchGistorgi(req.session.userId!, dto);
// }
// }
