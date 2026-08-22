import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { BalanceModule } from '@/balance/balance.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { QueueModule } from '@/queue/queue.module';
import { StormfinderModule } from '@/stormfinder/stormfinder.module';
import { DuckdnsModule } from '@/duckdns/duckdns.module';
import { ReportModule } from '@/report/report.module';
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
import { CheckProviderRegistry } from './providers/provider.registry';
import { StormfinderCheckHandler } from './providers/stormfinder/stormfinder.check-handler';
import { DuckdnsCheckHandler } from './providers/duckdns/duckdns.check-handler';
import { LimitationController } from './limitation/limitation.controller';
import { LimitationService } from './limitation/limitation.service';
import { TaxiController } from './taxi/taxi.controller';
import { TaxiService } from './taxi/taxi.service';
import { BatchModule } from '@/batch/batch.module';
import { CheckPriceController } from './price/check-price.controller';
import { CheckPriceService } from './price/check-price.service';

@Module({
  imports: [
    AuthModule,
    BalanceModule,
    PrismaModule,
    StormfinderModule,
    DuckdnsModule,
    ReportModule,
    forwardRef(() => BatchModule),
    forwardRef(() => QueueModule),
  ],
  controllers: [
    GibddController,
    GistorgiController,
    FsspController,
    BankruptcyController,
    InnController,
    LimitationController,
    TaxiController,
    CheckPriceController,
    CheckQueryController,
  ],
  providers: [
    CheckService,
    GibddService,
    GistorgiService,
    FsspService,
    BankruptcyService,
    InnService,
    LimitationService,
    TaxiService,
    CheckPriceService,
    CheckGateway,
    CheckProviderRegistry,
    StormfinderCheckHandler,
    DuckdnsCheckHandler,
  ],
  exports: [CheckService],
})
export class CheckModule {}
