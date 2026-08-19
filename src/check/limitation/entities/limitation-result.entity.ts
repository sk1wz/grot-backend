import { z } from 'zod';

const TextValueSchema = z.string().nullable().optional();

export const LimitationSchema = z.object({
  model: TextValueSchema,
  year: TextValueSchema,
  restriction_date: TextValueSchema,
  region: TextValueSchema,
  restriction_type: TextValueSchema,
  description: TextValueSchema,
});

export const LimitationResultSchema = z.object({
  vin: z.string(),
  limitations: z.array(LimitationSchema),
});

export type LimitationResult = z.infer<typeof LimitationResultSchema>;
