import { Controller, Get, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { type Request } from 'express';
import { Auth } from '@/auth/decorators/auth.decorator';
import { UserService } from './user.service';

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
  @Get('/')
  public async findUsers() {
    return this.userService.findUsers();
  }
}
