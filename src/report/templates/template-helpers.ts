import { Check } from '@/db';

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function formatJson(value: unknown): string {
  if (value === null || value === undefined) {
    return '—';
  }

  return escapeHtml(JSON.stringify(value, null, 2));
}

export function formatDate(check: Check): string {
  return check.completedAt?.toISOString() ?? '—';
}
