import { Check, CheckModuleEnums, CheckStatusEnums } from '@/db';

export type CheckResponse = {
  id: string;
  module: CheckModuleEnums;
  status: CheckStatusEnums;
  subjectBody: unknown;
  subjectBodyText: string;
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
      subjectBody: check.subjectBody,
      subjectBodyText: check.subjectBodyText,
      cost: check.cost,
      result: check.result,
      error: check.error,
      createdAt: check.createdAt,
      updatedAt: check.updatedAt,
      completedAt: check.completedAt,
    };
  }
}
