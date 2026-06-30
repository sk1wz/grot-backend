import { CheckModuleEnums } from '@prisma/__generated__/enums';

export const STORMFINDER_CHECK_PATHS = {
  [CheckModuleEnums.GIBDD]: '/checks/gibdd',
  [CheckModuleEnums.GISTORGI]: '/checks/gistorgi',
  [CheckModuleEnums.FSSP]: '/checks/fssp',
  [CheckModuleEnums.BANKRUPTCY]: '/checks/bankruptcy',
  [CheckModuleEnums.INN]: '/checks/inn',
} as const;

export type StormfinderCheckModule = keyof typeof STORMFINDER_CHECK_PATHS;
