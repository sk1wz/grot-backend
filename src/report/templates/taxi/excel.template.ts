import { Check } from '@/db';
import ExcelJS from 'exceljs';

const TAXI_FIELDS = [
  ['vin', 'VIN запроса'],
  ['year', 'Год'],
  ['brand', 'Марка'],
  ['model', 'Модель'],
  ['region', 'Регион'],
  ['record_vin', 'VIN в реестре'],
  ['record_date', 'Дата записи'],
  ['record_number', 'Номер записи'],
  ['registration_number', 'Регистрационный номер ТС'],
  ['record_status', 'Статус записи'],
  ['carrier_inn', 'ИНН перевозчика'],
  ['exclusion_date', 'Дата исключения ТС'],
  ['lifting_device', 'Подъёмное устройство'],
  ['registry_entry_date', 'Дата внесения в реестр'],
  ['carrier_name', 'Наименование перевозчика'],
] as const;

export function buildTaxiExcel(workbook: ExcelJS.Workbook, check: Check): void {
  const result = record(check.result);
  const vin = value(result.vin);
  const records = Array.isArray(result.records) ? result.records.map(record) : [];
  const sheet = workbook.addWorksheet('Реестр такси');

  sheet.addRow(TAXI_FIELDS.map(([, label]) => label));
  if (records.length) {
    sheet.addRows(
      records.map((record) =>
        TAXI_FIELDS.map(([field]) => {
          if (field === 'vin') return vin;
          if (field === 'record_vin') return value(record.vin);
          return value(record[field]);
        }),
      ),
    );
  } else {
    sheet.addRow([vin, 'Записей в реестре не найдено']);
  }

  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = {
    from: 'A1',
    to: { row: Math.max(sheet.rowCount, 1), column: TAXI_FIELDS.length },
  };
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC9D5E5' },
  };
  TAXI_FIELDS.forEach(([, label], index) => {
    const column = sheet.getColumn(index + 1);
    column.width = Math.min(Math.max(label.length + 2, 16), 34);
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
