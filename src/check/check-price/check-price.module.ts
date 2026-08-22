import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { CheckPriceService } from './check-price.service';

@Module({
  imports: [PrismaModule],
  providers: [CheckPriceService],
  exports: [CheckPriceService],
})
export class CheckPriceModule {}
