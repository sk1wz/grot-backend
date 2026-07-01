import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { type Request } from 'express';
import { Auth } from '@/auth/decorators/auth.decorator';
import { BalanceService } from './balance.service';
import {
  AdminBalanceChangeDto,
  GetUserTransactionsByAdminDto,
} from './dto/balance.dto';

@Controller('balance')
export class BalanceController {
  public constructor(private readonly balanceService: BalanceService) {}

  @Auth()
  @Get('transactions')
  public getTransactions(@Req() req: Request) {
    return this.balanceService.getUserTransactions(req.session.userId!);
  }

  @Auth('ADMIN')
  @Get('/admin/transactions/:id')
  public getUserTransactionsByAdmin(
    @Param() params: GetUserTransactionsByAdminDto,
  ) {
    return this.balanceService.getUserTransactionsByAdmin(params.id);
  }

  @Auth('ADMIN')
  @Post('/admin/debit')
  public debitByAdmin(@Body() dto: AdminBalanceChangeDto) {
    return this.balanceService.debitByAdmin(dto.userId, dto.amount);
  }

  @Auth('ADMIN')
  @Post('/admin/credit')
  public creditByAdmin(@Body() dto: AdminBalanceChangeDto) {
    return this.balanceService.creditByAdmin(dto.userId, dto.amount);
  }
}
