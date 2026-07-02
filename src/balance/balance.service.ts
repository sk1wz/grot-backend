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
import { NotificationService } from '@/notification/notification.service';
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
    private readonly notificationService: NotificationService,
  ) {}

  /* ПОЛЬЗОВАТЕЛЬСКИЕ ФУНКЦИИ */
  public async getTransactions(userId: string) {
    return this.prismaService.balanceTransaction.findMany({
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
  }

  /* АДМИНИСТРАТИВНЫЕ ФУНКЦИИ */
  public async getAllTransactionsByAdmin() {
    return this.prismaService.balanceTransaction.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  public async getTransactionsByAdmin(userId: string) {
    return this.prismaService.balanceTransaction.findMany({
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
  }

  public async debitByAdmin(dto: AdminBalanceChangeDto) {
    return this.debit(
      dto.userId,
      dto.amount,
      BalanceStatusEnums.BALANCE_PURCHASE,
      {
        action: 'Списание средств с баланса',
      },
    );
  }

  public async creditByAdmin(dto: AdminBalanceChangeDto) {
    return this.credit(
      dto.userId,
      dto.amount,
      BalanceStatusEnums.BALANCE_TOPUP,
      {
        action: 'Пополнение средств на баланс',
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
  ) {
    const result = await this.runInTransaction(tx, (client) =>
      this.applyChange(client, userId, -amount, status, meta, {
        requireSufficientFunds: true,
      }),
    );
    const response =
      BalanceChangeResponseTransform.fromBalanceChangeResponse(result);

    if (!tx) {
      await this.createBalanceNotification(
        userId,
        status,
        response.transaction.amount,
      );
    }

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

    if (!tx) {
      await this.createBalanceNotification(
        userId,
        status,
        response.transaction.amount,
      );
    }

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
      transaction,
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

  private async createBalanceNotification(
    userId: string,
    status: BalanceStatusEnums,
    amount: number,
  ): Promise<void> {
    const title =
      status === BalanceStatusEnums.BALANCE_TOPUP
        ? 'Пополнение баланса'
        : 'Списание баланса';
    const message =
      status === BalanceStatusEnums.BALANCE_TOPUP
        ? `Баланс пополнен на ${amount}`
        : `С баланса списано ${amount}`;

    await this.notificationService.create({
      userId,
      title,
      message,
    });
  }
}
