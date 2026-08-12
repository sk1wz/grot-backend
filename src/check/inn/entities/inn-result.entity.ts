import { z } from 'zod';

const TextValueSchema = z.union([z.string(), z.number()]).nullable().optional();

export const InnResultSchema = z.object({
  summary: z.object({
    inn: TextValueSchema,
    full_name: TextValueSchema,
    birth_date: TextValueSchema,
    passport_number: TextValueSchema,
  }),
});

export type InnResult = z.infer<typeof InnResultSchema>;
