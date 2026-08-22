import { z } from 'zod';
import {
  CreateProductSchema,
  GetAllProductSchema,
  GetProductByIdSchema,
  UpdateProductSchema,
  DeleteProductSchema,
} from '../validations/product.validation';

export type CreateProductDTO = z.infer<typeof CreateProductSchema>;
export type GetAllProductDTO = z.infer<typeof GetAllProductSchema>;
export type GetProductByIdDTO = z.infer<typeof GetProductByIdSchema>;
export type UpdateProductDTO = z.infer<typeof UpdateProductSchema>;
export type DeleteProductDTO = z.infer<typeof DeleteProductSchema>;
