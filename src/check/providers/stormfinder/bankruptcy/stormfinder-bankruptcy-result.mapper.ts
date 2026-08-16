import {
  BankruptcyResultSchema,
  type BankruptcyResult,
} from '@/check/bankruptcy/entities';

type FinderObject = Record<string, unknown>;
type TextValue = string | number | null | undefined;

/** Maps only the provider's raw bankruptcy records to the public result contract. */
export function mapStormfinderBankruptcyResult(raw: unknown): BankruptcyResult {
  const result = asObject(raw);
  const cases = Array.isArray(result.raw) ? result.raw.map(asObject) : [];

  return BankruptcyResultSchema.parse({
    cases: cases.map((caseItem) => ({
      id: textValue(caseItem.ID),
      inn: textValue(caseItem.ИНН),
      snils: textValue(caseItem.Снилс),
      is_defendant: textValue(caseItem.Ответчик),
      case_number: textValue(caseItem['Номер дела']),
      case_status: textValue(caseItem['Статус дела']),
      debtor_name: textValue(caseItem['ФИО должника']),
      procedure_status: textValue(caseItem['Текущий статус']),
      registration_address: textValue(caseItem['Адрес регистрации']),
      court_name: textValue(caseItem['Наименование суда']),
      debt_released: textValue(caseItem['Освобождён от долгов']),
      procedure_start_date: textValue(caseItem['Дата начала процедуры']),
      procedure_end_date: textValue(caseItem['Дата окончания процедуры']),
      case_card_url: textValue(caseItem['Ссылка на карточку кадарбитр']),
      bankruptcy_application_date: textValue(
        caseItem['Дата подачи заявления о банкротстве'],
      ),
    })),
  });
}

function asObject(value: unknown): FinderObject {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as FinderObject)
    : {};
}

function textValue(value: unknown): TextValue {
  return typeof value === 'string' ||
    typeof value === 'number' ||
    value === null
    ? value
    : undefined;
}
