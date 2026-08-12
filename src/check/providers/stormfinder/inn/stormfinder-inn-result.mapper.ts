import {
  InnResultSchema,
  type InnResult,
} from '@/check/inn/entities/inn-result.entity';

type FinderObject = Record<string, unknown>;
type TextValue = string | number | null | undefined;

/** Maps the provider response to the stable result contract returned to frontend. */
export function mapStormfinderInnResult(raw: unknown): InnResult {
  const result = asObject(raw);
  const summary = asObject(result.summary);

  return InnResultSchema.parse({
    autosintes_summary: {
      autosintes_inn: textValue(summary.инн),
      autosintes_full_name: textValue(summary.фио),
      autosintes_birth_date: textValue(summary['дата рождения']),
      autosintes_passport_number: textValue(summary['номер паспорта']),
    },
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
