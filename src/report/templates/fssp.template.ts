import { Check } from '@/db';
import { formatDate, formatJson } from './template-helpers';

export function renderFsspTemplate(check: Check): string {
  const subject = formatJson(check.subject);
  const result = formatJson(check.result);
  const completedAt = formatDate(check);

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Отчёт ФССП ${check.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #1a1a1a; }
    .page { border: 1px solid #e6e6e6; border-radius: 10px; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .title { font-size: 24px; font-weight: 700; }
    .badge { background: #eef5ff; color: #0b57d0; padding: 6px 10px; border-radius: 999px; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-bottom: 20px; }
    .label { color: #666; font-size: 12px; }
    .value { font-size: 14px; }
    .block { margin-top: 16px; }
    .block h2 { font-size: 15px; margin-bottom: 8px; }
    pre { background: #f7f9fb; border: 1px solid #edf1f5; padding: 12px; border-radius: 8px; white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body>
  <main class="page">
    <header class="header">
      <div class="title">Отчёт ФССП</div>
      <div class="badge">FSSP</div>
    </header>

    <section class="grid">
      <div><div class="label">ID проверки</div><div class="value">${check.id}</div></div>
      <div><div class="label">Завершена</div><div class="value">${completedAt}</div></div>
      <div><div class="label">Модуль</div><div class="value">${check.module}</div></div>
      <div><div class="label">Стоимость</div><div class="value">${check.cost}</div></div>
    </section>

    <section class="block">
      <h2>Данные запроса</h2>
      <pre>${subject}</pre>
    </section>

    <section class="block">
      <h2>Ответ ФССП</h2>
      <pre>${result}</pre>
    </section>
  </main>
</body>
</html>`;
}
