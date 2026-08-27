import { z } from 'zod';

export const CreateProductSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Nama produk wajib diisi' }).min(1, 'Nama produk wajib diisi'),
    sku: z.string({ message: 'SKU wajib diisi' }).min(1, 'SKU wajib diisi'),
    description: z.string().optional(),
    stock: z.number().int().min(0, 'Stok tidak boleh negatif').optional().default(0),
    minimumStock: z.number().int().min(0, 'Minimum stok tidak boleh negatif').optional().default(0),
    categoryId: z.string().uuid('ID kategori harus berformat UUID valid'),
    locationId: z.string().uuid('ID lokasi harus berformat UUID valid'),
  }),
});

export const GetAllProductSchema = z.object({
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      sort: z.string().optional(),
      categoryId: z.string().uuid('ID kategori harus berformat UUID valid').optional(),
      locationId: z.string().uuid('ID lokasi harus berformat UUID valid').optional(),
    })
    .optional(),
});

export const GetProductByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID produk harus berformat UUID valid'),
  }),
});

export const UpdateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID produk harus berformat UUID valid'),
  }),
  body: z.object({
    name: z.string().min(1, 'Nama produk tidak boleh kosong').optional(),
    sku: z.string().min(1, 'SKU tidak boleh kosong').optional(),
    description: z.string().optional(),
    minimumStock: z.number().int().min(0, 'Minimum stok tidak boleh negatif').optional(),
    categoryId: z.string().uuid('ID kategori harus berformat UUID valid').optional(),
    locationId: z.string().uuid('ID lokasi harus berformat UUID valid').optional(),
    isActive: z.boolean().optional(),
  }),
});

export const DeleteProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID produk harus berformat UUID valid'),
  }),
});
