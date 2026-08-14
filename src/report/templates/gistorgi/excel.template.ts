import { Check } from '@/db';
import ExcelJS from 'exceljs';

export function buildGistorgiExcel(
  workbook: ExcelJS.Workbook,
  check: Check,
): void {
  const result = record(check.result);
  const summary = record(result.summary);
  const vin = value(summary.vin);

  const lots = Array.isArray(result.lots) ? result.lots.map(record) : [];
  const lotsSheet = workbook.addWorksheet('Лоты');
  lotsSheet.addRow([
    'ВИН',
    'Статус лота',
    'Наименование лота',
    'Дата',
    'Ссылка',
  ]);
  if (lots.length)
    lotsSheet.addRows(
      lots.map((lot) => [
        vin,
        value(lot.lot_status),
        value(lot.lot_name),
        value(lot.lot_date),
        value(lot.lot_link),
      ]),
    );
  formatSheet(lotsSheet, 5);
}

function formatSheet(sheet: ExcelJS.Worksheet, columnCount: number): void {
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = {
    from: 'A1',
    to: { row: Math.max(sheet.rowCount, 1), column: columnCount },
  };
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC9D5E5' },
  };
  [22, 20, 45, 18, 45].slice(0, columnCount).forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
    sheet.getColumn(index + 1).alignment = { vertical: 'top', wrapText: true };
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
