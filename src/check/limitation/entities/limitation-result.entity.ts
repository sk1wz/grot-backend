import { z } from 'zod';

const TextValueSchema = z.string().nullable().optional();

export const LimitationSchema = z.object({
  a_model: TextValueSchema,
  a_year: TextValueSchema,
  a_restriction_date: TextValueSchema,
  a_region: TextValueSchema,
  a_author_name: TextValueSchema,
  a_author_phone: TextValueSchema,
  a_restriction_type: TextValueSchema,
  a_description: TextValueSchema,
  a_gibdd_id: TextValueSchema,
});

export const LimitationResultSchema = z.object({
  vin: z.string(),
  limitations: z.array(LimitationSchema),
});

export type LimitationResult = z.infer<typeof LimitationResultSchema>;
