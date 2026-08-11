import { z } from 'zod';


export const GetDashboardStatsSchema = z.object({
  query: z
    .object({
      period: z.enum(['today', 'week', 'month']).default('week'),
    })
    .optional(),
});

export const GetRecentMovementsSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().positive('Page harus minimal 1').default(1),
      limit: z.coerce.number().int().positive().max(50, 'Limit maksimal 50').default(10),
    })
    .optional(),
});