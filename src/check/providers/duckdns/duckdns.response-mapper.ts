import { CheckStatusEnums, Prisma } from '@/db';
import { DuckdnsVehicleCheckResponse } from '@/duckdns/duckdns.types';
import { ProviderCheckResult } from '../provider.types';
import { mapDuckdnsLimitationResult } from './limitation/duckdns-limitation-result.mapper';

export function mapDuckdnsLimitationResponse(
  response: DuckdnsVehicleCheckResponse,
  vin: string,
): ProviderCheckResult {
  const status = mapDuckdnsStatus(response.status);
  const error = response.error ?? response.checks?.find((check) => check.error)?.error;

  return {
    serviceId: response.request_id,
    status,
    ...(status === CheckStatusEnums.DONE
      ? {
          result: mapDuckdnsLimitationResult(response, vin) as Prisma.InputJsonValue,
        }
      : {}),
    ...(error ? { error: error as Prisma.InputJsonValue } : {}),
  };
}

function mapDuckdnsStatus(status: DuckdnsVehicleCheckResponse['status']): CheckStatusEnums {
  switch (status) {
    case 'processing': return CheckStatusEnums.RUNNING;
    case 'completed': return CheckStatusEnums.DONE;
    case 'error': return CheckStatusEnums.FAILED;
  }
}
