import { z } from 'zod';
import {
  CreateCategorySchema,
  GetAllCategorySchema,
  GetCategoryByIdSchema,
  UpdateCategorySchema,
  DeleteCategorySchema,
} from '../validations/category.validation';

export type CreateCategoryDTO = z.infer<typeof CreateCategorySchema>;
export type GetAllCategoryDTO = z.infer<typeof GetAllCategorySchema>;
export type GetCategoryByIdDTO = z.infer<typeof GetCategoryByIdSchema>;
export type UpdateCategoryDTO = z.infer<typeof UpdateCategorySchema>;
export type DeleteCategoryDTO = z.infer<typeof DeleteCategorySchema>;