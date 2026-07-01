import { CheckStatusEnums, Prisma } from '@/db';
import { StormfinderCheckResponse } from '@/stormfinder/stormfinder.types';

export function mapStormfinderStatus(
  status: StormfinderCheckResponse['status'],
): CheckStatusEnums {
  switch (status) {
    case 'queued':
      return CheckStatusEnums.QUEUED;
    case 'running':
      return CheckStatusEnums.RUNNING;
    case 'done':
      return CheckStatusEnums.DONE;
    case 'failed':
      return CheckStatusEnums.FAILED;
    default:
      return CheckStatusEnums.QUEUED;
  }
}

export function isActiveCheckStatus(status: CheckStatusEnums): boolean {
  return (
    status === CheckStatusEnums.QUEUED || status === CheckStatusEnums.RUNNING
  );
}

export function mapStormfinderResponseToCheckData(
  response: StormfinderCheckResponse,
): Prisma.CheckUpdateInput {
  const status = mapStormfinderStatus(response.status);
  const isTerminal =
    status === CheckStatusEnums.DONE || status === CheckStatusEnums.FAILED;

  return {
    serviceId: response.id,
    status,
    result: response.result as Prisma.InputJsonValue,
    error: response.error
      ? (response.error as Prisma.InputJsonValue)
      : undefined,
    completedAt: isTerminal ? new Date() : null,
  };
}

export function toCheckError(error: unknown): Prisma.InputJsonValue {
  return {
    message:
      error instanceof Error ? error.message : 'Ошибка создания проверки',
  };
}
