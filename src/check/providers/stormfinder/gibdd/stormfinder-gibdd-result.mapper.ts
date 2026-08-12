import {
  GibddResultSchema,
  type GibddResult,
} from '@/check/gibdd/entities/gibdd-result.entity';

type FinderObject = Record<string, unknown>;
type TextValue = string | number | null | undefined;

export function mapStormfinderGibddResult(raw: unknown): GibddResult {
  const result = asObject(raw);

  return GibddResultSchema.parse({
    fines: asArray(result.fines).map(mapFine),
    owners: asArray(result.owners).map(mapOwner),
    summary: mapSummary(asObject(result.summary)),
    accidents: asArray(result.accidents).map(mapAccident),
  });
}

function mapFine(value: unknown) {
  const fine = asObject(value);
  return {
    uin: textValue(fine['УИН']),
    date: textValue(fine['Дата']),
    time: textValue(fine['Время']),
    address: textValue(fine['Адрес']),
    amount: textValue(fine['Сумма']),
    status: textValue(fine['Статус']),
    article: textValue(fine['Статья']),
    reason: textValue(fine['Основание']),
    issuer: textValue(fine['Кем выписан']),
  };
}

function mapOwner(value: unknown) {
  const owner = asObject(value);
  return {
    from: textValue(owner.from),
    to: textValue(owner.to),
    type: textValue(owner.type),
  };
}

function mapAccident(value: unknown) {
  const accident = asObject(value);
  return {
    year: textValue(accident['Год']),
    accident_type: textValue(accident['Тип']),
    date: textValue(accident['Дата']),
    time: textValue(accident['Время']),
    city: textValue(accident['Город']),
    brand: textValue(accident['Марка']),
    model: textValue(accident['Модель']),
    region: textValue(accident['Регион']),
    status: textValue(accident['Состояние']),
    damages: textValue(accident['Повреждения']),
  };
}

function mapSummary(summary: FinderObject) {
  return {
    VIN: textValue(summary.VIN),
    year: textValue(summary['Год']),
    N_PTS: textValue(summary['N ПТС']),
    N_STS: textValue(summary['N СТС']),
    color: textValue(summary['Цвет']),
    model: textValue(summary['Модель']),
    date_PTS: textValue(summary['Дата ПТС']),
    date_STS: textValue(summary['Дата СТС']),
    in_rozisk: textValue(summary['В розыске']),
    reg_number: textValue(summary['Рег. номер']),
    engine_volume_cc: textValue(summary['Двигатель: объём (см³)']),
    engine_power_hp: textValue(summary['Двигатель: мощность (л.с.)']),
    engine_number: textValue(summary['Двигатель: номер']),
    pledges_count: textValue(summary['Кол-во залогов']),
    restrictions_count: textValue(summary['Кол-во ограничений']),
    total_fine: textValue(summary['Сумма штрафов']),
    osago_seria: textValue(summary['ОСАГО: серия']),
    osago_number: textValue(summary['ОСАГО: номер']),
    osago_contract_status: textValue(summary['ОСАГО: статус договора']),
    osago_usage_period: textValue(summary['ОСАГО: период использования']),
    osago_straxovka: textValue(summary['ОСАГО: страховая']),
    osago_extended_rb: textValue(summary['ОСАГО: расширение РБ']),
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
  return typeof value === 'string' ||
    typeof value === 'number' ||
    value === null
    ? value
    : undefined;
}
