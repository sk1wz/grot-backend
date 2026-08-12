import { z } from 'zod';

const TextValueSchema = z.union([z.string(), z.number()]).nullable().optional();

export const InnResultSchema = z.object({
  autosintes_summary: z.object({
    autosintes_inn: TextValueSchema,
    autosintes_full_name: TextValueSchema,
    autosintes_birth_date: TextValueSchema,
    autosintes_passport_number: TextValueSchema,
  }),
});

export type InnResult = z.infer<typeof InnResultSchema>;
