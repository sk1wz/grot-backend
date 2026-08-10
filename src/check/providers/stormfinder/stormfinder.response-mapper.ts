import { CheckStatusEnums, Prisma } from '@/db';
import { StormfinderCheckResponse } from '@/stormfinder/stormfinder.types';
import { ProviderCheckResult } from '../provider.types';

export function mapStormfinderResponse(
  response: StormfinderCheckResponse,
): ProviderCheckResult {
  return {
    serviceId: response.id,
    status: mapStormfinderStatus(response.status),
    ...(response.result
      ? { result: response.result as Prisma.InputJsonValue }
      : {}),
    ...(response.error
      ? { error: response.error as Prisma.InputJsonValue }
      : {}),
  };
}

function mapStormfinderStatus(
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
  }
}
