import { Check } from '@/db';
import { formatDate, formatJson } from './template-helpers';

export function renderGibddTemplate(check: Check): string {
  const subject = formatJson(check.subject);
  const result = formatJson(check.result);
  const completedAt = formatDate(check);

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Отчёт ГИБДД ${check.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 28px; color: #0f172a; background: #ffffff; }
    .banner { background: linear-gradient(90deg, #0f172a, #1d4ed8); color: #fff; padding: 18px 20px; border-radius: 10px; }
    .banner h1 { margin: 0; font-size: 21px; }
    .banner p { margin: 6px 0 0; opacity: 0.9; font-size: 13px; }
    .meta { margin: 16px 0 20px; padding: 12px 14px; border: 1px solid #dbeafe; border-radius: 8px; background: #f8fbff; }
    .meta-row { margin: 4px 0; font-size: 13px; }
    .cards { display: grid; grid-template-columns: 1fr; gap: 12px; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    .card h2 { margin: 0 0 8px; font-size: 15px; color: #1e3a8a; }
    pre { margin: 0; background: #f1f5f9; border-radius: 6px; padding: 10px; white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body>
  <section class="banner">
    <h1>Отчёт ГИБДД</h1>
    <p>Проверка сведений по транспортному средству</p>
  </section>

  <section class="meta">
    <div class="meta-row"><strong>ID:</strong> ${check.id}</div>
    <div class="meta-row"><strong>Модуль:</strong> ${check.module}</div>
    <div class="meta-row"><strong>Завершена:</strong> ${completedAt}</div>
    <div class="meta-row"><strong>Стоимость:</strong> ${check.cost}</div>
  </section>

  <section class="cards">
    <article class="card">
      <h2>Параметры запроса</h2>
      <pre>${subject}</pre>
    </article>
    <article class="card">
      <h2>Ответ ГИБДД</h2>
      <pre>${result}</pre>
    </article>
  </section>
</body>
</html>`;
}
