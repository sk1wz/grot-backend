import { z } from 'zod';

const TextValueSchema = z.union([z.string(), z.number()]).nullable().optional();

export const GistorgiResultSchema = z.object({
  summary: z.object({
    vin: TextValueSchema,
  }),
  lots: z.array(
    z.object({
      lot_name: TextValueSchema,
      lot_link: TextValueSchema,
      lot_date: TextValueSchema,
      lot_status: TextValueSchema,
    }),
  ),
});

export type GistorgiResult = z.infer<typeof GistorgiResultSchema>;
