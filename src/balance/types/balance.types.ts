export type BalanceChangeMeta = {
  action?: string;
};

export type BalanceChangeResult = {
  balance: number;
  transactionId: string;
};
