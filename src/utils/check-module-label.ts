import { CheckModuleEnums } from '@/db';

const CHECK_MODULE_LABELS: Record<CheckModuleEnums, string> = {
  [CheckModuleEnums.GIBDD]: 'ГИБДД',
  [CheckModuleEnums.LIMITATION]: 'Ограничения регистрации',
  [CheckModuleEnums.GISTORGI]: 'ГИС Торги',
  [CheckModuleEnums.FSSP]: 'ФССП',
  [CheckModuleEnums.BANKRUPTCY]: 'Банкротство',
  [CheckModuleEnums.INN]: 'ИНН',
};

export function getCheckModuleLabel(module: CheckModuleEnums): string {
  return CHECK_MODULE_LABELS[module];
}
