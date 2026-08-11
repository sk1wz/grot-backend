import {
  GistorgiResultSchema,
  type GistorgiResult,
} from '@/check/gistorgi/entities';

type FinderObject = Record<string, unknown>;
type TextValue = string | number | null | undefined;

export function mapStormfinderGistorgiResult(raw: unknown): GistorgiResult {
  const result = asObject(raw);
  const summary = asObject(result.summary);
  const lot = {
    lotName: textValue(summary['Лот: наименование']),
    lotLink: textValue(summary['Лот: ссылка']),
    lotDate: textValue(summary['Лот: дата']),
    lotStatus: textValue(summary['Лот: статус']),
  };

  return GistorgiResultSchema.parse({
    summary: {
      vin: textValue(summary.VIN) ?? textValue(result.input_key),
    },
    lots: hasLotData(lot) ? [lot] : [],
  });
}

function asObject(value: unknown): FinderObject {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as FinderObject)
    : {};
}

function textValue(value: unknown): TextValue {
  return typeof value === 'string' || typeof value === 'number' || value === null
    ? value
    : undefined;
}

function hasLotData(lot: Record<string, TextValue>): boolean {
  return Object.values(lot).some((value) => value !== undefined);
}
