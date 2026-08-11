import {
  GibddResultSchema,
  type GibddResult,
} from '@/check/gibdd/entities/gibdd-result.entity';

type FinderObject = Record<string, unknown>;
type TextValue = string | number | null | undefined;

export function mapStormfinderGibddResult(raw: unknown): GibddResult {
  const result = asObject(raw);

  return GibddResultSchema.parse({
    autosintes_fines: asArray(result.fines).map(mapFine),
    autosintes_owners: asArray(result.owners).map(mapOwner),
    autosintes_summary: mapSummary(asObject(result.summary)),
    autosintes_accidents: asArray(result.accidents).map(mapAccident),
  });
}

function mapFine(value: unknown) {
  const fine = asObject(value);
  return {
    autosintes_uin: textValue(fine['УИН']),
    autosintes_date: textValue(fine['Дата']),
    autosintes_time: textValue(fine['Время']),
    autosintes_address: textValue(fine['Адрес']),
    autosintes_amount: textValue(fine['Сумма']),
    autosintes_status: textValue(fine['Статус']),
    autosintes_article: textValue(fine['Статья']),
    autosintes_reason: textValue(fine['Основание']),
    autosintes_issuer: textValue(fine['Кем выписан']),
  };
}

function mapOwner(value: unknown) {
  const owner = asObject(value);
  return {
    autosintes_from: textValue(owner.from),
    autosintes_to: textValue(owner.to),
    autosintes_type: textValue(owner.type),
  };
}

function mapAccident(value: unknown) {
  const accident = asObject(value);
  return {
    autosintes_year: textValue(accident['Год']),
    autosintes_accident_type: textValue(accident['Тип']),
    autosintes_date: textValue(accident['Дата']),
    autosintes_time: textValue(accident['Время']),
    autosintes_city: textValue(accident['Город']),
    autosintes_brand: textValue(accident['Марка']),
    autosintes_model: textValue(accident['Модель']),
    autosintes_region: textValue(accident['Регион']),
    autosintes_status: textValue(accident['Состояние']),
    autosintes_damages: textValue(accident['Повреждения']),
  };
}

function mapSummary(summary: FinderObject) {
  return {
    autosintes_VIN: textValue(summary.VIN),
    autosintes_year: textValue(summary['Год']),
    autosintes_N_PTS: textValue(summary['N ПТС']),
    autosintes_N_STS: textValue(summary['N СТС']),
    autosintes_color: textValue(summary['Цвет']),
    autosintes_model: textValue(summary['Модель']),
    autosintes_date_PTS: textValue(summary['Дата ПТС']),
    autosintes_date_STS: textValue(summary['Дата СТС']),
    autosintes_in_rozisk: textValue(summary['В розыске']),
    autosintes_reg_number: textValue(summary['Рег. номер']),
    autosintes_engine_volume_cc: textValue(summary['Двигатель: объём (см³)']),
    autosintes_engine_power_hp: textValue(summary['Двигатель: мощность (л.с.)']),
    autosintes_engine_number: textValue(summary['Двигатель: номер']),
    autosintes_pledges_count: textValue(summary['Кол-во залогов']),
    autosintes_restrictions_count: textValue(summary['Кол-во ограничений']),
    autosintes_total_fine: textValue(summary['Сумма штрафов']),
    autosintes_osago_seria: textValue(summary['ОСАГО: серия']),
    autosintes_osago_number: textValue(summary['ОСАГО: номер']),
    autosintes_osago_contract_status: textValue(summary['ОСАГО: статус договора']),
    autosintes_osago_usage_period: textValue(summary['ОСАГО: период использования']),
    autosintes_osago_straxovka: textValue(summary['ОСАГО: страховая']),
    autosintes_osago_extended_rb: textValue(summary['ОСАГО: расширение РБ']),
  };
}

function asObject(value: unknown): FinderObject {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as FinderObject)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function textValue(value: unknown): TextValue {
  return typeof value === 'string' || typeof value === 'number' || value === null
    ? value
    : undefined;
}
