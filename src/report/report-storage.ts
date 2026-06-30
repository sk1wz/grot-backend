import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const REPORTS_STORAGE_DIR = join(process.cwd(), 'storage', 'reports');

export function buildReportFilePath(
  userId: string,
  checkId: string,
  date: Date = new Date(),
): string {
  const datePart = date.toISOString().slice(0, 10);

  return join(REPORTS_STORAGE_DIR, datePart, userId, `${checkId}.pdf`);
}

export function saveReportPdf(
  userId: string,
  checkId: string,
  pdf: Buffer,
  date: Date = new Date(),
): string {
  const filePath = buildReportFilePath(userId, checkId, date);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, pdf);

  return filePath;
}
