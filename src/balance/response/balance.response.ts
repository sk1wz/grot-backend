import { BalanceTransaction } from '@/db';

export type BalanceChangeResponse = {
  balance: number;
  transaction: Omit<BalanceTransaction, 'amount'> & { amount: number };
};

export class BalanceChangeResponseTransform {
  static fromBalanceChangeResponse(
    result: BalanceChangeResponse,
  ): BalanceChangeResponse {
    return {
      balance: Number(result.balance),
      transaction: {
        ...result.transaction,
        amount: Number(result.transaction.amount),
      },
    };
  }
}
