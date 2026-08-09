export type CheckType =
  | 'for_fio_dob'
  | 'for_inn'
  | 'for_ip'
  | 'for_doc_id'
  | 'for_fio'
  | 'for_structured'
  | 'for_text';

export type CheckBody = {
  type?: CheckType;
  subjectBody: object;
};

export type StoredSubjectBody = Record<string, unknown>;

export function toStoredSubjectBody({
  type,
  subjectBody,
}: CheckBody): StoredSubjectBody {
  return type ? { type, ...subjectBody } : { ...subjectBody };
}

export function toProviderCheckBody(subjectBody: StoredSubjectBody): CheckBody {
  const { type, ...payload } = subjectBody;

  return {
    ...(typeof type === 'string' ? { type: type as CheckType } : {}),
    subjectBody: payload,
  };
}
