import { z } from 'zod';
import {
  CreateProductSchema,
  GetAllProductSchema,
  GetProductByIdSchema,
  UpdateProductSchema,
  DeleteProductSchema,
} from '../validations/product.validation';

export type CreateProductInput = z.infer<typeof CreateProductSchema>['body'];
export type GetAllProductQuery = z.infer<typeof GetAllProductSchema>['query'];
export type GetProductByIdParams = z.infer<typeof GetProductByIdSchema>['params'];
export type UpdateProductParams = z.infer<typeof UpdateProductSchema>['params'];
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>['body'];
export type DeleteProductParams = z.infer<typeof DeleteProductSchema>['params'];