import { z } from 'zod';
import {
  GetAllExampleSchema,
  GetExampleByIdSchema,
  CreateExampleSchema,
  UpdateExampleSchema,
  PartialUpdateExampleSchema,
  DeleteExampleSchema,
  BulkCreateExampleSchema,
  CreateExampleWithItemsSchema,
} from '../validations/example.validation';

// Types dari Zod Infer
export type GetAllExampleQuery = z.infer<typeof GetAllExampleSchema>['query'];
export type GetExampleByIdParams = z.infer<typeof GetExampleByIdSchema>['params'];

export type CreateExampleInput = z.infer<typeof CreateExampleSchema>['body'];

export type UpdateExampleParams = z.infer<typeof UpdateExampleSchema>['params'];
export type UpdateExampleInput = z.infer<typeof UpdateExampleSchema>['body'];

export type PartialUpdateExampleInput = z.infer<typeof PartialUpdateExampleSchema>['body'];
export type DeleteExampleParams = z.infer<typeof DeleteExampleSchema>['params'];

export type BulkCreateExampleInput = z.infer<typeof BulkCreateExampleSchema>['body'];
export type CreateExampleWithItemsInput = z.infer<typeof CreateExampleWithItemsSchema>['body'];