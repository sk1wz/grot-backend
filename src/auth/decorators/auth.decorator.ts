import { applyDecorators, CanActivate, Type, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/__generated__/enums';
import { Roles } from './roles.decorator';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';

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
