import { Check } from '@/db';
import ExcelJS from 'exceljs';

const LIMITATION_FIELDS = [
  ['vin', 'VIN'],
  ['model', 'Модель'],
  ['year', 'Год выпуска'],
  ['restriction_date', 'Дата ограничения'],
  ['region', 'Регион'],
  ['restriction_type', 'Вид ограничения'],
  ['description', 'Описание'],
] as const;

export function buildLimitationExcel(
  workbook: ExcelJS.Workbook,
  check: Check,
): void {
  const result = record(check.result);
  const vin = value(result.vin);
  const limitations = Array.isArray(result.limitations)
    ? result.limitations.map(record)
    : [];
  const sheet = workbook.addWorksheet('Ограничения');

  sheet.addRow(LIMITATION_FIELDS.map(([, label]) => label));
  if (limitations.length) {
    sheet.addRows(
      limitations.map((limitation) =>
        LIMITATION_FIELDS.map(([field]) =>
          field === 'vin' ? vin : value(limitation[field]),
        ),
      ),
    );
  }

  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = {
    from: 'A1',
    to: { row: Math.max(sheet.rowCount, 1), column: LIMITATION_FIELDS.length },
  };
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC9D5E5' },
  };
  [20, 24, 14, 18, 24, 28, 20, 32, 70, 20].forEach((width, index) => {
    const column = sheet.getColumn(index + 1);
    column.width = width;
    column.alignment = { vertical: 'top', wrapText: true };
  });
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function value(value: unknown): string {
  return value === null || value === undefined || value === ''
    ? '—'
    : String(value);
}
