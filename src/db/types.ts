export type {
  User,
  CheckPrice,
  Check,
  Report,
  BalanceTransaction,
  Token,
} from '@prisma/__generated__/client';

export { Prisma, PrismaClient } from '@prisma/__generated__/client';

export type { JsonValue } from '@prisma/client/runtime/client';

export type BalanceChangeMeta = {
  action?: string;
};
