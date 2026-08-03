import { z } from 'zod';
import {
  CreateCategorySchema,
  GetAllCategorySchema,
  GetCategoryByIdSchema,
  UpdateCategorySchema,
  DeleteCategorySchema,
} from '../validations/category.validation';

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>['body'];
export type GetAllCategoryQuery = z.infer<typeof GetAllCategorySchema>['query'];
export type GetCategoryByIdParams = z.infer<typeof GetCategoryByIdSchema>['params'];
export type UpdateCategoryParams = z.infer<typeof UpdateCategorySchema>['params'];
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>['body'];
export type DeleteCategoryParams = z.infer<typeof DeleteCategorySchema>['params'];