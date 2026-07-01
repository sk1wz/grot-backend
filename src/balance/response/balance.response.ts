import { BalanceTransaction } from '@/db';

export type BalanceChangeResponse = {
  balance: number;
  transaction: BalanceTransaction;
};
export class BalanceChangeResponseTransform {
  static fromBalanceChangeResult(
    result: BalanceChangeResponse,
  ): BalanceChangeResponse {
    return {
      balance: result.balance,
      transaction: result.transaction,
    };
  }
}
