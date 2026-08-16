import { z } from 'zod';

const TextValueSchema = z.union([z.string(), z.number()]).nullable().optional();

export const BankruptcyCaseSchema = z.object({
  id: TextValueSchema,
  inn: TextValueSchema,
  snils: TextValueSchema,
  is_defendant: TextValueSchema,
  case_number: TextValueSchema,
  case_status: TextValueSchema,
  debtor_name: TextValueSchema,
  procedure_status: TextValueSchema,
  registration_address: TextValueSchema,
  court_name: TextValueSchema,
  debt_released: TextValueSchema,
  procedure_start_date: TextValueSchema,
  procedure_end_date: TextValueSchema,
  case_card_url: TextValueSchema,
  bankruptcy_application_date: TextValueSchema,
});

export const BankruptcyResultSchema = z.object({
  cases: z.array(BankruptcyCaseSchema),
});

export type BankruptcyResult = z.infer<typeof BankruptcyResultSchema>;
