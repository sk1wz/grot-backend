import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { type Request } from 'express';
import { Auth } from '@/auth/decorators';
import { BalanceService } from './balance.service';
import { AdminBalanceChangeDto } from './dto';

@Controller('balance')
export class BalanceController {
  public constructor(private readonly balanceService: BalanceService) {}

  @Auth()
  @Get('transactions')
  public getTransactions(@Req() req: Request) {
    return this.balanceService.getTransactions(req.session.userId!);
  }
  @Auth('ADMIN')
  @Get('/admin/transactions')
  public getTransactionsByAdmin() {
    return this.balanceService.getAllTransactionsByAdmin();
  }

  @Auth('ADMIN')
  @Get('/admin/transactions/:id')
  public getUserTransactionsByAdmin(@Param() params: { id: string }) {
    return this.balanceService.getTransactionsByAdmin(params.id);
  }

  @Auth('ADMIN')
  @Post('/admin/debit')
  public debitByAdmin(@Body() dto: AdminBalanceChangeDto) {
    return this.balanceService.debitByAdmin(dto);
  }

  @Auth('ADMIN')
  @Post('/admin/credit')
  public creditByAdmin(@Body() dto: AdminBalanceChangeDto) {
    return this.balanceService.creditByAdmin(dto);
  }
}
