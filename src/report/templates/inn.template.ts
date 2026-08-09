import { Check } from '@/db';
import { formatDate, formatJson } from './template-helpers';

export function renderInnTemplate(check: Check): string {
  const subject = formatJson(check.subjectBody);
  const result = formatJson(check.result);
  const completedAt = formatDate(check);

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Отчёт ИНН ${check.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; color: #111; background: #fff; }
    .top { padding: 24px 32px; border-bottom: 2px solid #f0f0f0; }
    .top h1 { margin: 0 0 6px; font-size: 22px; }
    .muted { color: #666; font-size: 13px; }
    .content { padding: 24px 32px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    td { border: 1px solid #e8e8e8; padding: 10px; vertical-align: top; }
    td:first-child { width: 180px; background: #fafafa; color: #666; }
    .box { margin-top: 14px; }
    .box h2 { margin: 0 0 8px; font-size: 15px; }
    pre { margin: 0; background: #f7f7f7; border-radius: 6px; padding: 12px; white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body>
  <header class="top">
    <h1>Отчёт ИНН</h1>
    <div class="muted">Подробный отчёт по проверке налоговых данных</div>
  </header>
  <section class="content">
    <table>
      <tr><td>ID проверки</td><td>${check.id}</td></tr>
      <tr><td>Модуль</td><td>${check.module}</td></tr>
      <tr><td>Завершена</td><td>${completedAt}</td></tr>
      <tr><td>Стоимость</td><td>${check.cost}</td></tr>
    </table>

    <div class="box">
      <h2>Исходные данные</h2>
      <pre>${subject}</pre>
    </div>

    <div class="box">
      <h2>Результаты проверки ИНН</h2>
      <pre>${result}</pre>
    </div>
  </section>
</body>
</html>`;
}
