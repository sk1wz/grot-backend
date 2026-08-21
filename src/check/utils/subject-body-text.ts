import { CheckModuleEnums } from '@/db';

type StoredSubjectBody = Record<string, unknown>;

export function buildSubjectBodyText(
  module: CheckModuleEnums,
  subjectBody: StoredSubjectBody,
): string {
  const value = (key: string) =>
    typeof subjectBody[key] === 'string' ? subjectBody[key].trim() : '';

  switch (module) {
    case CheckModuleEnums.GIBDD:
    case CheckModuleEnums.LIMITATION:
    case CheckModuleEnums.GISTORGI:
    case CheckModuleEnums.TAXI:
      return `${value('vin')}`;
    case CheckModuleEnums.FSSP:
      if (value('inn')) return `${value('inn')}`;
      if (value('ip')) return `${value('ip')}`;
      if (value('doc_id')) return `${value('doc_id')}`;
      return [value('fio'), value('dob')].filter(Boolean).join(', ');
    case CheckModuleEnums.BANKRUPTCY:
      return value('inn') ? `${value('inn')}` : value('fio');
    case CheckModuleEnums.INN:
      return (
        value('text') ||
        [value('fio'), value('dob'), value('passport')]
          .filter(Boolean)
          .join(', ')
      );
    default:
      return '';
  }
}
