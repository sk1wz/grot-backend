import { z } from 'zod';

const TextValueSchema = z.union([z.string(), z.number()]).nullable().optional();

export const GistorgiResultSchema = z.object({
  summary: z.object({
    vin: TextValueSchema,
  }),
  lots: z.array(
    z.object({
      lotName: TextValueSchema,
      lotLink: TextValueSchema,
      lotDate: TextValueSchema,
      lotStatus: TextValueSchema,
    }),
  ),
});

export type GistorgiResult = z.infer<typeof GistorgiResultSchema>;
