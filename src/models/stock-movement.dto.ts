import type { z } from 'zod';
import type {
  CreateInboundSchema,
  CreateOutboundSchema,
  GetMovementHistorySchema,
} from '../validations/stock-movement.validation';

// 1. DTO untuk Payload/Body Barang Masuk
export type CreateInboundDTO = z.infer<typeof CreateInboundSchema>['body'];

// 2. DTO untuk Payload/Body Barang Keluar
export type CreateOutboundDTO = z.infer<typeof CreateOutboundSchema>['body'];

// 3. DTO untuk Query Parameters Riwayat Stock Movement
export type GetMovementHistoryDTO = z.infer<typeof GetMovementHistorySchema>['query'];