import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from '@/user/user.service';

type RequestWithUser = Request & {
  user?: Awaited<ReturnType<UserService['findById']>>;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.session?.userId;

    if (!userId) {
      throw new UnauthorizedException('Требуется авторизация');
    }

    const user = await this.userService.findById(userId);
    request.user = user;
    request.session.isBlocked = user.isBlocked;

    return true;
  }
}
