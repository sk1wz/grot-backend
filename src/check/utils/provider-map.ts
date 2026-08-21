import { CheckModuleEnums, CheckProviderEnums } from '@/db';

export const CHECK_PROVIDER_BY_MODULE = {
  [CheckModuleEnums.GIBDD]: CheckProviderEnums.STORMFINDER,
  [CheckModuleEnums.LIMITATION]: CheckProviderEnums.DUCKDNS,
  [CheckModuleEnums.GISTORGI]: CheckProviderEnums.STORMFINDER,
  [CheckModuleEnums.FSSP]: CheckProviderEnums.STORMFINDER,
  [CheckModuleEnums.BANKRUPTCY]: CheckProviderEnums.STORMFINDER,
  [CheckModuleEnums.INN]: CheckProviderEnums.STORMFINDER,
  [CheckModuleEnums.TAXI]: CheckProviderEnums.STORMFINDER,
} as const satisfies Record<CheckModuleEnums, CheckProviderEnums>;

export function getCheckProvider(module: CheckModuleEnums): CheckProviderEnums {
  return CHECK_PROVIDER_BY_MODULE[module];
}
