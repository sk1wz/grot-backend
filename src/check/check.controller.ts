import { Controller, Get, Param, Req } from '@nestjs/common';
import { type Request } from 'express';
import { Auth } from '@/auth/decorators';
import { CheckService } from './check.service';

@Controller('checks')
export class CheckQueryController {
  public constructor(private readonly checkService: CheckService) {}

  @Auth()
  @Get()
  public getAllChecks(@Req() req: Request) {
    return this.checkService.getAllChecks(req.session.userId!);
  }

  @Auth()
  @Get(':id')
  public getCheckById(@Req() req: Request, @Param('id') id: string) {
    return this.checkService.getCheckById(req.session.userId!, id);
  }

  @Auth('ADMIN')
  @Get('admin/check/:id')
  public getCheckByIdAdmin(@Param('id') id: string) {
    return this.checkService.getCheckByIdAdmin(id);
  }

  @Auth('ADMIN')
  @Get('admin/:userId')
  public getUserChecksByAdmin(@Param('userId') userId: string) {
    return this.checkService.getAllChecks(userId);
  }
}
