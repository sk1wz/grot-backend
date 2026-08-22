import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
} from '@nestjs/common';
import { Auth } from '@/auth/decorators';
import { CheckModuleEnums } from '@/db';
import { UpdateCheckPriceDto } from './dto/update-check-price.dto';
import { CheckPriceService } from './check-price.service';

@Controller('checks/prices')
export class CheckPriceController {
  public constructor(private readonly checkPriceService: CheckPriceService) {}

  @Auth()
  @Get()
  public list() {
    return this.checkPriceService.list();
  }

  @Auth('ADMIN')
  @Patch(':module')
  public update(
    @Param('module', new ParseEnumPipe(CheckModuleEnums))
    module: CheckModuleEnums,
    @Body() dto: UpdateCheckPriceDto,
  ) {
    return this.checkPriceService.update(module, dto);
  }
}
