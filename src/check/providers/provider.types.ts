import {
  Check,
  CheckProviderEnums,
  CheckStatusEnums,
  Prisma,
} from '@/db';

export type ProviderCheckResult = {
  serviceId: string;
  status: CheckStatusEnums;
  result?: Prisma.InputJsonValue;
  error?: Prisma.InputJsonValue;
};

export interface CheckProviderHandler {
  readonly provider: CheckProviderEnums;
  submit(check: Check): Promise<ProviderCheckResult>;
  poll(check: Check): Promise<ProviderCheckResult>;
}
