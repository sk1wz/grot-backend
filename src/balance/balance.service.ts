import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/__generated__/client';
import { BalanceStatusEnums } from '@prisma/__generated__/enums';
import { BalanceChangeMeta, BalanceChangeResult } from './types/balance.types';
import { NotificationService } from '@/notification/notification.service';
import { BalanceGateway } from './balance.gateway';

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class BalanceService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly balanceGateway: BalanceGateway,
  ) {}

  public async getUserTransactions(userId: string) {
    return this.prismaService.balanceTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async getUserTransactionsByAdmin(userId: string) {
    return this.prismaService.balanceTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async debitByAdmin(
    userId: string,
    amount: number,
  ): Promise<BalanceChangeResult> {
    return this.debit(userId, amount, BalanceStatusEnums.BALANCE_PURCHASE, {
      action: 'Списание средств с баланса',
    });
  }

  public async creditByAdmin(
    userId: string,
    amount: number,
  ): Promise<BalanceChangeResult> {
    return this.credit(userId, amount, BalanceStatusEnums.BALANCE_TOPUP, {
      action: 'Пополнение средств на баланс',
    });
  }

  /* Системные */
  public async getBalance(userId: string): Promise<number> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user) {
      throw new BadRequestException('Не удалось получить баланс.');
    }

    return user.balance;
  }
  /* ФУНКЦИЯ ДЛЯ СНЯТИЯ СРЕДСТВ С БАЛАНСА */
  public async debit(
    userId: string,
    amount: number,
    status: BalanceStatusEnums,
    meta?: BalanceChangeMeta,
    tx?: TransactionClient,
  ): Promise<BalanceChangeResult> {
    this.assertPositiveAmount(amount);

    const result = await this.runInTransaction(tx, (client) =>
      this.applyChange(client, userId, -amount, status, meta, {
        requireSufficientFunds: true,
      }),
    );

    if (!tx) {
      this.publish(userId, result.balance, status, meta);
    }

    return result;
  }

  /* ФУНКЦИЯ ДЛЯ ПОПОЛНЕНИЯ БАЛАНСА */
  public async credit(
    userId: string,
    amount: number,
    status: BalanceStatusEnums,
    meta?: BalanceChangeMeta,
    tx?: TransactionClient,
  ): Promise<BalanceChangeResult> {
    this.assertPositiveAmount(amount);

    const result = await this.runInTransaction(tx, (client) =>
      this.applyChange(client, userId, amount, status, meta),
    );

    if (!tx) {
      this.publish(userId, result.balance, status, meta);
    }

    return result;
  }

  /* ФУНКЦИЯ ДЛЯ ПРИМЕНЕНИЯ ИЗМЕНЕНИЯ БАЛАНСА */
  private async applyChange(
    client: TransactionClient,
    userId: string,
    signedAmount: number,
    status: BalanceStatusEnums,
    meta: BalanceChangeMeta | undefined,
    options?: { requireSufficientFunds?: boolean },
  ): Promise<BalanceChangeResult> {
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user) {
      throw new BadRequestException('Не удалось изменить баланс');
    }

    if (options?.requireSufficientFunds && user.balance + signedAmount < 0) {
      throw new HttpException(
        'Недостаточно средств на балансе',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const updatedUser = await client.user.update({
      where: { id: userId },
      data: { balance: { increment: signedAmount } },
      select: { balance: true },
    });

    const transactionAmount = Math.abs(signedAmount);

    const transaction = await client.balanceTransaction.create({
      data: {
        userId,
        amount: transactionAmount,
        status,
        meta: meta ? (meta as Prisma.InputJsonValue) : undefined,
      },
    });

    return {
      balance: updatedUser.balance,
      transactionId: transaction.id,
    };
  }

  private async runInTransaction<T>(
    tx: TransactionClient | undefined,
    fn: (client: TransactionClient) => Promise<T>,
  ): Promise<T> {
    if (tx) {
      return fn(tx);
    }

    return this.prismaService.$transaction(fn);
  }

  private assertPositiveAmount(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException(
        'Сумма должна быть положительным целым числом',
      );
    }
  }

  private publish(
    userId: string,
    balance: number,
    status: BalanceStatusEnums,
    meta?: BalanceChangeMeta,
  ): void {
    const payload = {
      balance,
      status,
      meta,
      createdAt: new Date().toISOString(),
    };
    this.balanceGateway.emitBalanceUpdated(userId, payload);
  }
}
