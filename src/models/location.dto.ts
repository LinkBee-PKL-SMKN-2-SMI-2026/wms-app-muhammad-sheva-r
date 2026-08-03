import { z } from 'zod';
import {
  CreateLocationSchema,
  GetAllLocationSchema,
  GetLocationByIdSchema,
  UpdateLocationSchema,
  DeleteLocationSchema,
} from '../validations/location.validation';

export type CreateLocationInput = z.infer<typeof CreateLocationSchema>['body'];
export type GetAllLocationQuery = z.infer<typeof GetAllLocationSchema>['query'];
export type GetLocationByIdParams = z.infer<typeof GetLocationByIdSchema>['params'];
export type UpdateLocationParams = z.infer<typeof UpdateLocationSchema>['params'];
export type UpdateLocationInput = z.infer<typeof UpdateLocationSchema>['body'];
export type DeleteLocationParams = z.infer<typeof DeleteLocationSchema>['params'];