import { Check } from '@/db';
import ExcelJS from 'exceljs';

const BANKRUPTCY_FIELDS = [
  ['id', 'ID'],
  ['inn', 'ИНН'],
  ['snils', 'СНИЛС'],
  ['is_defendant', 'Ответчик'],
  ['case_number', 'Номер дела'],
  ['case_status', 'Статус дела'],
  ['debtor_name', 'ФИО должника'],
  ['procedure_status', 'Текущий статус'],
  ['registration_address', 'Адрес регистрации'],
  ['court_name', 'Наименование суда'],
  ['debt_released', 'Освобождён от долгов'],
  ['procedure_start_date', 'Дата начала процедуры'],
  ['procedure_end_date', 'Дата окончания процедуры'],
  ['case_card_url', 'Ссылка на карточку КАД Арбитр'],
  ['bankruptcy_application_date', 'Дата подачи заявления о банкротстве'],
] as const;

export function buildBankruptcyExcel(
  workbook: ExcelJS.Workbook,
  check: Check,
): void {
  const result = record(check.result);
  const cases = Array.isArray(result.cases) ? result.cases.map(record) : [];
  const sheet = workbook.addWorksheet('Банкротство');

  sheet.addRow(BANKRUPTCY_FIELDS.map(([, label]) => label));
  if (cases.length) {
    sheet.addRows(
      cases.map((caseItem) =>
        BANKRUPTCY_FIELDS.map(([field]) => value(caseItem[field])),
      ),
    );
  }

  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = {
    from: 'A1',
    to: { row: Math.max(sheet.rowCount, 1), column: BANKRUPTCY_FIELDS.length },
  };
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC9D5E5' },
  };
  BANKRUPTCY_FIELDS.forEach(([, label], index) => {
    const column = sheet.getColumn(index + 1);
    column.width = Math.min(Math.max(label.length + 2, 18), 55);
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
