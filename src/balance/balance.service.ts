import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { BalanceChangeMeta, BalanceStatusEnums, JsonValue, Prisma } from '@/db';
import { BalanceGateway } from './balance.gateway';
import { AdminBalanceChangeDto } from './dto';
import {
  BalanceChangeResponse,
  BalanceChangeResponseTransform,
} from './response';

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class BalanceService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly balanceGateway: BalanceGateway,
  ) {}

  public async getTransactions(userId: string) {
    const transactions = await this.prismaService.balanceTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        status: true,
        meta: true,
        createdAt: true,
      },
    });

    return transactions;
  }

  public async getTransactionsByAdmin(userId: string) {
    const transactions = await this.prismaService.balanceTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        status: true,
        meta: true,
        createdAt: true,
      },
    });

    return transactions;
  }

  public async debitByAdmin(dto: AdminBalanceChangeDto) {
    return this.debit(
      dto.userId,
      dto.amount,
      BalanceStatusEnums.BALANCE_PURCHASE,
      {
        action: 'Списание баланса администратором',
      },
    );
  }

  public async creditByAdmin(dto: AdminBalanceChangeDto) {
    return this.credit(
      dto.userId,
      dto.amount,
      BalanceStatusEnums.BALANCE_TOPUP,
      {
        action: 'Пополнение баланса администратором',
      },
    );
  }

  /* СИСТЕМНЫЕ ФУНКЦИИ */

  /* ФУНКЦИЯ ДЛЯ СНЯТИЯ СРЕДСТВ С БАЛАНСА */
  public async debit(
    userId: string,
    amount: number,
    status: BalanceStatusEnums,
    meta?: BalanceChangeMeta,
    tx?: TransactionClient,
  ): Promise<BalanceChangeResponse> {
    const result = await this.runInTransaction(tx, (client) =>
      this.applyChange(client, userId, -amount, status, meta, {
        requireSufficientFunds: true,
      }),
    );
    const response =
      BalanceChangeResponseTransform.fromBalanceChangeResponse(result);

    this.publish(userId, response);
    return response;
  }

  /* ФУНКЦИЯ ДЛЯ ПОПОЛНЕНИЯ БАЛАНСА */
  public async credit(
    userId: string,
    amount: number,
    status: BalanceStatusEnums,
    meta?: BalanceChangeMeta,
    tx?: TransactionClient,
  ): Promise<BalanceChangeResponse> {
    const result = await this.runInTransaction(tx, (client) =>
      this.applyChange(client, userId, amount, status, meta),
    );
    const response =
      BalanceChangeResponseTransform.fromBalanceChangeResponse(result);

    this.publish(userId, response);
    return response;
  }

  /* ФУНКЦИЯ ДЛЯ ПРИМЕНЕНИЯ ИЗМЕНЕНИЯ БАЛАНСА */
  private async applyChange(
    client: TransactionClient,
    userId: string,
    signedAmount: number,
    status: BalanceStatusEnums,
    meta: JsonValue | undefined,
    options?: { requireSufficientFunds?: boolean },
  ): Promise<BalanceChangeResponse> {
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user) {
      throw new BadRequestException('Не удалось изменить баланс');
    }

    const delta = new Prisma.Decimal(signedAmount);
    const nextBalance = new Prisma.Decimal(user.balance).plus(delta);

    if (options?.requireSufficientFunds && nextBalance.isNegative()) {
      throw new HttpException(
        'Недостаточно средств на балансе',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const updatedUser = await client.user.update({
      where: { id: userId },
      data: { balance: { increment: delta } },
      select: { balance: true },
    });

    const transaction = await client.balanceTransaction.create({
      data: {
        userId,
        amount: delta.abs(),
        status,
        meta: meta ? (meta as Prisma.InputJsonValue) : undefined,
      },
    });

    return {
      balance: Number(updatedUser.balance),
      transaction: {
        ...transaction,
        amount: Number(transaction.amount),
      },
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

  private publish(userId: string, result: BalanceChangeResponse): void {
    this.balanceGateway.emitBalanceUpdated(userId, result);
  }
}
