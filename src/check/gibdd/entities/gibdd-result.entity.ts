import { z } from 'zod';

const TextValueSchema = z.union([z.string(), z.number()]).nullable().optional();

export const GibddFineSchema = z.object({
  autosintes_uin: TextValueSchema,
  autosintes_date: TextValueSchema,
  autosintes_time: TextValueSchema,
  autosintes_address: TextValueSchema,
  autosintes_amount: TextValueSchema,
  autosintes_status: TextValueSchema,
  autosintes_article: TextValueSchema,
  autosintes_reason: TextValueSchema,
  autosintes_issuer: TextValueSchema,
});

export const GibddOwnerSchema = z.object({
  autosintes_from: TextValueSchema,
  autosintes_to: TextValueSchema,
  autosintes_type: TextValueSchema,
});

export const GibddAccidentSchema = z.object({
  autosintes_year: TextValueSchema,
  autosintes_accident_type: TextValueSchema,
  autosintes_date: TextValueSchema,
  autosintes_time: TextValueSchema,
  autosintes_city: TextValueSchema,
  autosintes_brand: TextValueSchema,
  autosintes_model: TextValueSchema,
  autosintes_region: TextValueSchema,
  autosintes_status: TextValueSchema,
  autosintes_damages: TextValueSchema,
});

export const GibddSummarySchema = z.object({
  autosintes_VIN: TextValueSchema,
  autosintes_year: TextValueSchema,
  autosintes_N_PTS: TextValueSchema,
  autosintes_N_STS: TextValueSchema,
  autosintes_color: TextValueSchema,
  autosintes_model: TextValueSchema,
  autosintes_date_PTS: TextValueSchema,
  autosintes_date_STS: TextValueSchema,
  autosintes_in_rozisk: TextValueSchema,
  autosintes_reg_number: TextValueSchema,
  autosintes_engine_volume_cc: TextValueSchema,
  autosintes_engine_power_hp: TextValueSchema,
  autosintes_engine_number: TextValueSchema,
  autosintes_pledges_count: TextValueSchema,
  autosintes_restrictions_count: TextValueSchema,
  autosintes_total_fine: TextValueSchema,
  autosintes_osago_seria: TextValueSchema,
  autosintes_osago_number: TextValueSchema,
  autosintes_osago_contract_status: TextValueSchema,
  autosintes_osago_usage_period: TextValueSchema,
  autosintes_osago_straxovka: TextValueSchema,
  autosintes_osago_extended_rb: TextValueSchema,
});

export const GibddResultSchema = z.object({
  autosintes_fines: z.array(GibddFineSchema),
  autosintes_owners: z.array(GibddOwnerSchema),
  autosintes_summary: GibddSummarySchema,
  autosintes_accidents: z.array(GibddAccidentSchema),
});

export type GibddResult = z.infer<typeof GibddResultSchema>;
