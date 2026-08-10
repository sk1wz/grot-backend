import { CheckBody } from '../types';

export function toStoredSubjectBody({
  type,
  subjectBody,
}: CheckBody): Record<string, unknown> {
  const payload = { ...subjectBody } as Record<string, unknown>;

  return type ? { type, ...payload } : payload;
}
