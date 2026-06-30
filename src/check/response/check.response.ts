import { Check } from '@prisma/__generated__/client';
import {
  CheckModuleEnums,
  CheckStatusEnums,
} from '@prisma/__generated__/enums';

export type CheckResponse = {
  id: string;
  module: CheckModuleEnums;
  status: CheckStatusEnums;
  subject: unknown;
  cost: number;
  result: unknown;
  error: unknown;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

export class CheckResponseDto {
  public static fromCheck(check: Check): CheckResponse {
    return {
      id: check.id,
      module: check.module,
      status: check.status,
      subject: check.subject,
      cost: check.cost,
      result: check.result,
      error: check.error,
      createdAt: check.createdAt,
      updatedAt: check.updatedAt,
      completedAt: check.completedAt,
    };
  }
}
