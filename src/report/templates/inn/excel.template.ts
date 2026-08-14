import { Check } from '@/db';
import ExcelJS from 'exceljs';

export function buildInnExcel(workbook: ExcelJS.Workbook, check: Check): void {
  const summary = record(record(check.result).summary);
  const sheet = workbook.addWorksheet('ИНН');
  sheet.addRow(['ФИО', 'Дата рождения', 'Номер паспорта', 'ИНН']);
  sheet.addRow([
    value(summary.full_name),
    value(summary.birth_date),
    value(summary.passport_number),
    value(summary.inn),
  ]);
  formatSheet(sheet);
}

function formatSheet(sheet: ExcelJS.Worksheet): void {
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = 'A1:D2';
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC9D5E5' },
  };
  [26, 18, 22, 18].forEach((width, index) => {
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
