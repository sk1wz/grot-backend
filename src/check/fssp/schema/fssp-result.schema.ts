import { z } from 'zod';

const nullableText = z.union([z.string(), z.number()]).nullable().optional();

export const FsspSummarySchema = z.object({
  id: nullableText,
  date: nullableText,
  service: nullableText,
  initiationDate: nullableText,
  bailiffContacts: nullableText,
  enforcementSubject: nullableText,
  enforcementFee: nullableText,
  bailiffDepartment: nullableText,
  consolidatedProceedingNumber: nullableText,
  bailiff: nullableText,
  debtAmount: nullableText,
  enforcementProceedingNumber: nullableText,
  bailiffDepartmentAddress: nullableText,
  terminationReason: nullableText,
  debtor: nullableText,
  executiveDocumentDetails: nullableText,
});

export const FsspResultSchema = z.object({
  summary: FsspSummarySchema,
});
export type FsspResult = z.infer<typeof FsspResultSchema>;
