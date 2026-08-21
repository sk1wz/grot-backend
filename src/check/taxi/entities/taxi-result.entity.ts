import { z } from 'zod';

const TextValueSchema = z.union([z.string(), z.number()]).nullable().optional();

export const TaxiRecordSchema = z.object({
  year: TextValueSchema,
  brand: TextValueSchema,
  model: TextValueSchema,
  region: TextValueSchema,
  vin: TextValueSchema,
  record_date: TextValueSchema,
  record_number: TextValueSchema,
  registration_number: TextValueSchema,
  record_status: TextValueSchema,
  carrier_inn: TextValueSchema,
  exclusion_date: TextValueSchema,
  lifting_device: TextValueSchema,
  registry_entry_date: TextValueSchema,
  carrier_name: TextValueSchema,
});

export const TaxiResultSchema = z.object({
  vin: TextValueSchema,
  records: z.array(TaxiRecordSchema),
});

export type TaxiResult = z.infer<typeof TaxiResultSchema>;
