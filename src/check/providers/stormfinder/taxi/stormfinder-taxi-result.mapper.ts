import { TaxiResultSchema, type TaxiResult } from '@/check/taxi/entities';

type FinderObject = Record<string, unknown>;
type TextValue = string | number | null | undefined;

/** Maps the provider response to the stable result contract returned to frontend. */
export function mapStormfinderTaxiResult(raw: unknown): TaxiResult {
  const result = asObject(raw);

  return TaxiResultSchema.parse({
    vin: textValue(result.input_key),
    records: asArray(result.records).map(mapRecord),
  });
}

function mapRecord(value: unknown) {
  const record = asObject(value);

  return {
    year: textValue(record['Год']),
    brand: textValue(record['Марка']),
    model: textValue(record['Модель']),
    region: textValue(record['Регион']),
    vin: textValue(record['VIN (в БД)']),
    found: textValue(record['Найдено']),
    requested_vin: textValue(record['VIN (запрос)']),
    record_date: textValue(record['Дата записи']),
    record_number: textValue(record['Номер записи']),
    registration_number: textValue(record['Рег. номер ТС']),
    record_status: textValue(record['Статус записи']),
    carrier_inn: textValue(record['ИНН перевозчика']),
    exclusion_date: textValue(record['Дата исключения ТС']),
    lifting_device: textValue(record['Подъёмное устройство']),
    registry_entry_date: textValue(record['Дата внесения в реестр']),
    carrier_name: textValue(record['Наименование перевозчика']),
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
