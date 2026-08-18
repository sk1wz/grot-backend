import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
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
}
