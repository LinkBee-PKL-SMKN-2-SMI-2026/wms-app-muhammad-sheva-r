import { z } from 'zod';

export const GetSummarySchema = z.object({
  query: z
    .object({
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
        .optional(),
    })
    .optional(),
});


export const GetLowStockSchema = z.object({
  query: z
    .object({
      threshold: z.coerce.number().int().positive('Threshold harus berupa angka positif').default(10),
      page: z.coerce.number().int().positive('Page harus minimal 1').default(1),
      limit: z.coerce.number().int().positive().max(100, 'Limit maksimal 100').default(10),
    })
    .optional(),
});