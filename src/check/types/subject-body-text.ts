import { CheckModuleEnums } from '@/db';
import { StoredSubjectBody } from './check-body.type';

export function buildSubjectBodyText(
  module: CheckModuleEnums,
  subjectBody: StoredSubjectBody,
): string {
  const value = (key: string) =>
    typeof subjectBody[key] === 'string' ? subjectBody[key].trim() : '';

  switch (module) {
    case CheckModuleEnums.GIBDD:
    case CheckModuleEnums.GISTORGI:
      return `VIN ${value('vin')}`;
    case CheckModuleEnums.FSSP:
      if (value('inn')) return `ИНН ${value('inn')}`;
      if (value('ip')) return `ИП ${value('ip')}`;
      if (value('doc_id')) return `Документ ${value('doc_id')}`;
      return [value('fio'), value('dob')].filter(Boolean).join(', ');
    case CheckModuleEnums.BANKRUPTCY:
      return value('inn') ? `ИНН ${value('inn')}` : value('fio');
    case CheckModuleEnums.INN:
      return value('text') || [value('fio'), value('dob'), value('passport')].filter(Boolean).join(', ');
    default:
      return '';
  }
}
