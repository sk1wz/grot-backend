import {
  LimitationResult,
  LimitationResultSchema,
} from '@/check/limitation/entities';
import { DuckdnsVehicleCheckResponse } from '@/duckdns/duckdns.types';

export function mapDuckdnsLimitationResult(
  response: DuckdnsVehicleCheckResponse,
  vin: string,
): LimitationResult {
  const restrictionCheck = response.checks?.[0];
  const details = restrictionCheck?.result?.details ?? [];

  return LimitationResultSchema.parse({
    vin,
    limitations: details.map((detail) => ({
      model: detail.model,
      year: detail.year,
      restriction_date: detail.restriction_date,
      region: detail.region,
      restriction_type: detail.restriction_type,
      description: detail.description,
    })),
  });
}
