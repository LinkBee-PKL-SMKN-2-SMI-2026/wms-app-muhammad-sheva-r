import { z } from 'zod';

export const CreateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Nama produk harus diisi'),
    sku: z.string().min(1, 'SKU harus diisi'),
    description: z.string().optional(),
    stock: z.number().int().min(0, 'Stok minimal 0'),
    minimumStock: z.number().int().min(0, 'Stok minimal harus >= 0'),
    categoryId: z.string().uuid('categoryId harus berupa UUID valid'),
    locationId: z.string().uuid('locationId harus berupa UUID valid'),
  }),
});

export const GetAllProductSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    sort: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    locationId: z.string().uuid().optional(),
  }),
});

export const GetProductByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID harus berupa UUID valid'),
  }),
});

export const UpdateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID harus berupa UUID valid'),
  }),
  body: z.object({
    name: z.string().optional(),
    sku: z.string().optional(),
    description: z.string().optional(),
    minimumStock: z.number().int().min(0).optional(),
    categoryId: z.string().uuid().optional(),
    locationId: z.string().uuid().optional(),
  }),
});

export const DeleteProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID harus berupa UUID valid'),
  }),
});