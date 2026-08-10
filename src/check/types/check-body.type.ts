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
