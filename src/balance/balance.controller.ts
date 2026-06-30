import { Controller, Get, Req } from '@nestjs/common';
import { type Request } from 'express';
import { Auth } from '@/auth/decorators/auth.decorator';
import { BalanceService } from './balance.service';

@Controller('balance')
export class BalanceController {
  public constructor(private readonly balanceService: BalanceService) {}

  @Auth()
  @Get('transactions')
  public getTransactions(@Req() req: Request) {
    return this.balanceService.getTransactions(req.session.userId!);
  }
}
