import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { BalanceModule } from '@/balance/balance.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { QueueModule } from '@/queue/queue.module';
import { StormfinderModule } from '@/stormfinder/stormfinder.module';
import { CheckQueryController } from './check.controller';
import { CheckService } from './check.service';
import { BankruptcyController } from './bankruptcy/bankruptcy.controller';
import { BankruptcyService } from './bankruptcy/bankruptcy.service';
import { FsspController } from './fssp/fssp.controller';
import { FsspService } from './fssp/fssp.service';
import { GibddController } from './gibdd/gibdd.controller';
import { GibddService } from './gibdd/gibdd.service';
import { GistorgiController } from './gistorgi/gistrogi.controller';
import { GistorgiService } from './gistorgi/gistorgi.service';
import { InnController } from './inn/inn.controller';
import { InnService } from './inn/inn.service';
import { CheckGateway } from './check.gateway';

@Module({
  imports: [
    AuthModule,
    BalanceModule,
    PrismaModule,
    StormfinderModule,
    forwardRef(() => QueueModule),
  ],
  controllers: [
    GibddController,
    GistorgiController,
    FsspController,
    BankruptcyController,
    InnController,
    CheckQueryController,
  ],
  providers: [
    CheckService,
    GibddService,
    GistorgiService,
    FsspService,
    BankruptcyService,
    InnService,
    CheckGateway,
  ],
  exports: [CheckService],
})
export class CheckModule {}
