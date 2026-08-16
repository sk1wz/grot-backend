import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { Auth } from '@/auth/decorators/auth.decorator';
import { UserService } from './user.service';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Auth()
  @HttpCode(HttpStatus.OK)
  @Get('/me')
  public async getMe(@Req() req: Request) {
    return this.userService.getMe(req.session.userId!);
  }

  @Auth()
  @HttpCode(HttpStatus.OK)
  @Patch('/password')
  public async changePassword(
    @Req() req: Request,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(req.session.userId!, dto);
  }

  @Auth('ADMIN')
  @HttpCode(HttpStatus.OK)
  @Get('/')
  public async findUsers() {
    return this.userService.findUsers();
  }

  @Auth('ADMIN')
  @HttpCode(HttpStatus.OK)
  @Delete('/:id')
  public async deleteUser(@Param('id') id: string) {
    return this.userService.deleteById(id);
  }
}
