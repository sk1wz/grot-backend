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
      a_model: detail.model,
      a_year: detail.year,
      a_restriction_date: detail.restriction_date,
      a_region: detail.region,
      a_author_name: detail.author_name,
      a_author_phone: detail.author_phone,
      a_restriction_type: detail.restriction_type,
      a_description: detail.description,
      a_gibdd_id: detail.gibdd_id,
    })),
  });
}
