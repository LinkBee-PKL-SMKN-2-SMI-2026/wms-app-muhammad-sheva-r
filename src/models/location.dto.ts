import { z } from 'zod';
import {
  CreateLocationSchema,
  GetAllLocationSchema,
  GetLocationByIdSchema,
  UpdateLocationSchema,
  DeleteLocationSchema,
} from '../validations/location.validation';

export type CreateLocationDTO = z.infer<typeof CreateLocationSchema>;
export type GetAllLocationDTO = z.infer<typeof GetAllLocationSchema>;
export type GetLocationByIdDTO = z.infer<typeof GetLocationByIdSchema>;
export type UpdateLocationDTO = z.infer<typeof UpdateLocationSchema>;
export type DeleteLocationDTO = z.infer<typeof DeleteLocationSchema>;