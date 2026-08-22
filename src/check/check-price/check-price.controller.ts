import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Put,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { Auth } from '@/auth/decorators';
import { CheckModuleEnums } from '@/db';
import { UpdateCheckPriceDto } from './dto/update-check-price.dto';
import { CheckPriceService } from './check-price.service';

@Controller('checks/prices')
export class CheckPriceController {
  public constructor(private readonly checkPriceService: CheckPriceService) {}

  @Auth()
  @Get()
  public list(@Req() req: Request) {
    return this.checkPriceService.listForUser(req.session.userId!);
  }

  @Auth('ADMIN')
  @Get('users/:userId')
  public listPersonal(@Param('userId') userId: string) {
    return this.checkPriceService.listPersonal(userId);
  }

  @Auth('ADMIN')
  @Put('users/:userId/:module')
  public setPersonal(
    @Param('userId') userId: string,
    @Param('module', new ParseEnumPipe(CheckModuleEnums))
    module: CheckModuleEnums,
    @Body() dto: UpdateCheckPriceDto,
  ) {
    return this.checkPriceService.setPersonal(userId, module, dto);
  }

  @Auth('ADMIN')
  @Delete('users/:userId/:module')
  public deletePersonal(
    @Param('userId') userId: string,
    @Param('module', new ParseEnumPipe(CheckModuleEnums))
    module: CheckModuleEnums,
  ) {
    return this.checkPriceService.deletePersonal(userId, module);
  }
}
