import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.middleware.ts';
import { validate } from '../middlewares/validate.middleware';
import {
  CreateInboundSchema,
  CreateOutboundSchema,
  GetMovementHistorySchema,
} from '../validations/stock-movement.validation';
import {
  createInbound,
  createOutbound,
  getMovementHistory,
} from '../controllers/stock-movement.controller';

const router = Router();

// 1. Endpoint Barang Masuk (INBOUND)
router.post(
  '/inbound',
  authenticate,
  validate(CreateInboundSchema),
  createInbound
);

// 2. Endpoint Barang Keluar (OUTBOUND)
router.post(
  '/outbound',
  authenticate,
  validate(CreateOutboundSchema),
  createOutbound
);

// 3. Endpoint Riwayat Pergerakan Stok (HISTORY)
router.get(
  '/history',
  authenticate,
  validate(GetMovementHistorySchema),
  getMovementHistory
);

export default router;