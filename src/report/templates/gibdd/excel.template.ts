import { Check } from '@/db';
import ExcelJS from 'exceljs';

type ResultRecord = Record<string, unknown>;

export function buildGibddExcel(
  workbook: ExcelJS.Workbook,
  check: Check,
): void {
  const result = record(check.result);
  const summary = record(result.summary);
  const vin = value(summary.VIN);

  addSheet(
    workbook,
    '\u0421\u0432\u043e\u0434\u043a\u0430',
    [
      'VIN',
      ...Object.keys(summary)
        .filter((key) => key !== 'VIN')
        .map(summaryHeader),
    ],
    [
      [
        vin,
        ...Object.entries(summary)
          .filter(([key]) => key !== 'VIN')
          .map(([, item]) => value(item)),
      ],
    ],
  );
  addListSheet(
    workbook,
    '\u0428\u0442\u0440\u0430\u0444\u044b',
    vin,
    rows(result.fines),
    fineHeader,
  );
  addListSheet(
    workbook,
    '\u0414\u0422\u041f',
    vin,
    rows(result.accidents),
    accidentHeader,
  );
}

function addListSheet(
  workbook: ExcelJS.Workbook,
  title: string,
  vin: string,
  items: ResultRecord[],
  label: (column: string) => string,
): void {
  const columns = uniqueKeys(items);
  addSheet(
    workbook,
    title,
    ['VIN', ...columns.map(label)],
    items.map((item) => [vin, ...columns.map((column) => value(item[column]))]),
  );
}

function addSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  headers: string[],
  data: unknown[][],
): void {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow(headers);
  if (data.length) sheet.addRows(data);
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = {
    from: 'A1',
    to: { row: Math.max(data.length + 1, 1), column: headers.length },
  };
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC9D5E5' },
  };
  headers.forEach((header, index) => {
    const column = sheet.getColumn(index + 1);
    column.width = Math.min(Math.max(header.length + 2, 14), 40);
    column.alignment = { vertical: 'top', wrapText: true };
  });
}

function uniqueKeys(items: ResultRecord[]): string[] {
  return [...new Set(items.flatMap((item) => Object.keys(item)))];
}
function summaryHeader(column: string): string {
  return (
    {
      year: 'Год выпуска',
      N_PTS: '№ ПТС',
      N_STS: '№ СТС',
      color: 'Цвет',
      model: 'Модель',
      date_PTS: 'Дата выдачи ПТС',
      date_STS: 'Дата выдачи СТС',
      in_rozisk: 'Розыск',
      reg_number: 'Гос. номер',
      engine_volume_cc: 'Объём двигателя, см³',
      engine_power_hp: 'Мощность, л.с.',
      engine_number: '№ двигателя',
      pledges_count: 'Залоги',
      restrictions_count: 'Ограничения',
      total_fine: 'Сумма штрафов',
      osago_seria: 'Серия ОСАГО',
      osago_number: '№ ОСАГО',
      osago_contract_status: 'Статус ОСАГО',
      osago_usage_period: 'Период ОСАГО',
      osago_straxovka: 'Страховая компания',
      osago_extended_rb: 'Расширение на БС',
    }[column] ?? column
  );
}
function fineHeader(column: string): string {
  return (
    {
      uin: 'УИН',
      date: 'Дата',
      time: 'Время',
      address: 'Адрес',
      amount: 'Сумма',
      status: 'Статус',
      article: 'Статья',
      reason: 'Причина',
      issuer: 'Кем выписан',
    }[column] ?? column
  );
}
function accidentHeader(column: string): string {
  return (
    {
      year: 'Год',
      accident_type: 'Тип ДТП',
      date: 'Дата',
      time: 'Время',
      city: 'Город',
      brand: 'Марка',
      model: 'Модель',
      region: 'Регион',
      status: 'Статус',
      damages: 'Повреждения',
    }[column] ?? column
  );
}
function rows(value: unknown): ResultRecord[] {
  return Array.isArray(value) ? value.map(record) : [];
}
function record(value: unknown): ResultRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as ResultRecord)
    : {};
}
function value(value: unknown): string {
  return value === null || value === undefined || value === ''
    ? '\u2014'
    : String(value);
}
