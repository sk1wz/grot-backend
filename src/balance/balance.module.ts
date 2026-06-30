import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { BalanceService } from './balance.service';
import { BalanceController } from './balance.controller';
import { AuthModule } from '@/auth/auth.module';
import { NotificationModule } from '@/notification/notification.module';
import { BalanceGateway } from './balance.gateway';

@Module({
  imports: [PrismaModule, AuthModule, NotificationModule],
  controllers: [BalanceController],
  providers: [BalanceService, BalanceGateway],
  exports: [BalanceService],
})
export class BalanceModule {}
