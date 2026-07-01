import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole } from '@prisma/__generated__/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';

type RequestWithUser = Request & {
  user?: {
    role: UserRole;
  };
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!request.user) {
      throw new UnauthorizedException('Требуется авторизация');
    }

    if (!requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException(
        'Недостаточно прав для выполнения этого действия.',
      );
    }

    return true;
  }
}
