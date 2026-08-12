import { z } from 'zod';

const TextValueSchema = z.union([z.string(), z.number()]).nullable().optional();

export const GibddFineSchema = z.object({
  uin: TextValueSchema,
  date: TextValueSchema,
  time: TextValueSchema,
  address: TextValueSchema,
  amount: TextValueSchema,
  status: TextValueSchema,
  article: TextValueSchema,
  reason: TextValueSchema,
  issuer: TextValueSchema,
});

export const GibddOwnerSchema = z.object({
  from: TextValueSchema,
  to: TextValueSchema,
  type: TextValueSchema,
});

export const GibddAccidentSchema = z.object({
  year: TextValueSchema,
  accident_type: TextValueSchema,
  date: TextValueSchema,
  time: TextValueSchema,
  city: TextValueSchema,
  brand: TextValueSchema,
  model: TextValueSchema,
  region: TextValueSchema,
  status: TextValueSchema,
  damages: TextValueSchema,
});

export const GibddSummarySchema = z.object({
  VIN: TextValueSchema,
  year: TextValueSchema,
  N_PTS: TextValueSchema,
  N_STS: TextValueSchema,
  color: TextValueSchema,
  model: TextValueSchema,
  date_PTS: TextValueSchema,
  date_STS: TextValueSchema,
  in_rozisk: TextValueSchema,
  reg_number: TextValueSchema,
  engine_volume_cc: TextValueSchema,
  engine_power_hp: TextValueSchema,
  engine_number: TextValueSchema,
  pledges_count: TextValueSchema,
  restrictions_count: TextValueSchema,
  total_fine: TextValueSchema,
  osago_seria: TextValueSchema,
  osago_number: TextValueSchema,
  osago_contract_status: TextValueSchema,
  osago_usage_period: TextValueSchema,
  osago_straxovka: TextValueSchema,
  osago_extended_rb: TextValueSchema,
});

export const GibddResultSchema = z.object({
  fines: z.array(GibddFineSchema),
  owners: z.array(GibddOwnerSchema),
  summary: GibddSummarySchema,
  accidents: z.array(GibddAccidentSchema),
});

export type GibddResult = z.infer<typeof GibddResultSchema>;
