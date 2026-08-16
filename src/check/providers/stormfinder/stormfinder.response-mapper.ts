import { CheckModuleEnums, CheckStatusEnums, Prisma } from '@/db';
import { StormfinderCheckResponse } from '@/stormfinder/stormfinder.types';
import { ProviderCheckResult } from '../provider.types';
import { mapStormfinderGibddResult } from './gibdd/stormfinder-gibdd-result.mapper';
import { mapStormfinderInnResult } from './inn/stormfinder-inn-result.mapper';
import { mapStormfinderGistorgiResult } from './gistorgi/stormfinder-gistorgi-result.mapper';
import { mapStormfinderFsspResult } from './fssp/stormfinder-fssp-result.mapper';
import { mapStormfinderBankruptcyResult } from './bankruptcy/stormfinder-bankruptcy-result.mapper';

export function mapStormfinderResponse(
  response: StormfinderCheckResponse,
  module: CheckModuleEnums,
): ProviderCheckResult {
  return {
    serviceId: response.id,
    status: mapStormfinderStatus(response.status),
    ...(response.result
      ? {
          result: mapStormfinderResult(
            module,
            response.result,
          ) as Prisma.InputJsonValue,
        }
      : {}),
    ...(response.error
      ? { error: response.error as Prisma.InputJsonValue }
      : {}),
  };
}

function mapStormfinderResult(
  module: CheckModuleEnums,
  result: Record<string, unknown>,
): Prisma.InputJsonValue {
  if (module === CheckModuleEnums.GIBDD) {
    return mapStormfinderGibddResult(result) as Prisma.InputJsonValue;
  }

  if (module === CheckModuleEnums.INN) {
    return mapStormfinderInnResult(result) as Prisma.InputJsonValue;
  }

  if (module === CheckModuleEnums.GISTORGI) {
    return mapStormfinderGistorgiResult(result) as Prisma.InputJsonValue;
  }

  if (module === CheckModuleEnums.FSSP) {
    return mapStormfinderFsspResult(result) as Prisma.InputJsonValue;
  }

  if (module === CheckModuleEnums.BANKRUPTCY) {
    return mapStormfinderBankruptcyResult(result) as Prisma.InputJsonValue;
  }

  return result as Prisma.InputJsonValue;
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
