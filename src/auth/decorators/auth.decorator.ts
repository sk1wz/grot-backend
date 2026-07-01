import { applyDecorators, CanActivate, Type, UseGuards } from '@nestjs/common';
import { AuthGuard, RolesGuard } from '../guards';
import { Roles } from './roles.decorator';
import { UserRole } from '@/db';

export const Auth = (...roles: UserRole[]) => {
  if (roles.length > 0) {
    return applyDecorators(
      Roles(...roles),
      UseGuards(
        AuthGuard as Type<CanActivate>,
        RolesGuard as Type<CanActivate>,
      ),
    );
  }

  return applyDecorators(
    UseGuards(AuthGuard as Type<CanActivate>, RolesGuard as Type<CanActivate>),
  );
};
