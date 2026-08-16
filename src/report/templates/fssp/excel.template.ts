import { Check } from '@/db';
import ExcelJS from 'exceljs';

const FSSP_FIELDS = [
  ['id', 'ID'],
  ['date', 'Дата'],
  ['service', 'Сервис'],
  ['initiationDate', 'Дата возбуждения'],
  ['bailiffContacts', 'Контакты пристава'],
  ['enforcementSubject', 'Предмет исполнения'],
  ['enforcementFee', 'Исполнительный сбор'],
  ['bailiffDepartment', 'Отдел судебных приставов'],
  ['consolidatedProceedingNumber', 'Номер сводного производства'],
  ['bailiff', 'Судебный пристав-исполнитель'],
  ['debtAmount', 'Сумма задолженности по ИП (руб.)'],
  ['enforcementProceedingNumber', 'Исполнительное производство №'],
  ['bailiffDepartmentAddress', 'Адрес отдела судебных приставов'],
  ['terminationReason', 'Причина окончания или прекращения ИП'],
  ['debtor', 'Должник'],
  ['executiveDocumentDetails', 'Реквизиты исполнительного документа'],
] as const;

export function buildFsspExcel(workbook: ExcelJS.Workbook, check: Check): void {
  const result = record(check.result);
  const lots = Array.isArray(result.lots)
    ? result.lots.map(record)
    : [record(result.summary)];
  const sheet = workbook.addWorksheet('ФССП');
  sheet.addRow(FSSP_FIELDS.map(([, label]) => label));
  if (lots.length) {
    sheet.addRows(
      lots.map((lot) => FSSP_FIELDS.map(([field]) => value(lot[field]))),
    );
  }
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = {
    from: 'A1',
    to: { row: Math.max(sheet.rowCount, 1), column: FSSP_FIELDS.length },
  };
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC9D5E5' },
  };
  FSSP_FIELDS.forEach(([, label], index) => {
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
