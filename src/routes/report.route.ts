import { Router } from 'express';
import { getSummary, getLowStock } from '../controllers/report.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { validate } from '../middlewares/validate.middleware';
import { GetSummarySchema, GetLowStockSchema } from '../models/reporting.dto';
import z from 'zod';


export const GetSummarySchema = z.object({
  query: z.object({
    date: z.string().optional(),
  }),
});

export const GetLowStockSchema = z.object({
  query: z.object({
    threshold: z.coerce.number().int().positive().default(10),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
});
 
const router = Router();
 
router.get('/summary', authenticate, validate(GetSummarySchema), getSummary);
router.get('/low-stock', authenticate, validate(GetLowStockSchema), getLowStock);
 
export default router;