import { z } from 'zod';

const TextValueSchema = z.union([z.string(), z.number()]).nullable().optional();

export const InnResultSchema = z.object({
  summary: z.object({
    inn: TextValueSchema,
    fullName: TextValueSchema,
    birthDate: TextValueSchema,
    passportNumber: TextValueSchema,
  }),
});

export type InnResult = z.infer<typeof InnResultSchema>;
