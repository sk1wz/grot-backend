import { Check } from '@/db';
import { formatDate, formatJson } from './template-helpers';

export function renderDefaultTemplate(check: Check): string {
  const subject = formatJson(check.subjectBody);
  const result = formatJson(check.result);
  const completedAt = formatDate(check);

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Отчёт ${check.module} ${check.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
    h1 { font-size: 22px; margin-bottom: 8px; }
    .meta { color: #555; margin-bottom: 24px; }
    section { margin-bottom: 24px; }
    h2 { font-size: 16px; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    pre { background: #f7f7f7; padding: 12px; border-radius: 6px; white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body>
  <h1>Отчёт по проверке</h1>
  <div class="meta">
    <div>ID проверки: ${check.id}</div>
    <div>Модуль: ${check.module}</div>
    <div>Завершена: ${completedAt}</div>
  </div>
  <section>
    <h2>Запрос</h2>
    <pre>${subject}</pre>
  </section>
  <section>
    <h2>Результат</h2>
    <pre>${result}</pre>
  </section>
</body>
</html>`;
}
