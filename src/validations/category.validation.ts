import { z } from 'zod';

export const CreateCategorySchema = z.object({
  body: z.object({
    name: z
      .string({ message: 'Nama kategori wajib diisi' })
      .min(3, 'Nama kategori minimal 3 karakter'),
    description: z.string().optional(),
  }),
});

export const GetAllCategorySchema = z.object({
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      sort: z.string().optional(),
    })
    .optional(),
});

export const GetCategoryByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID harus berformat UUID valid'),
  }),
});

export const UpdateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('ID harus berformat UUID valid'),
  }),
  body: z.object({
    name: z.string().min(3, 'Nama kategori minimal 3 karakter').optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const DeleteCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('ID harus berformat UUID valid'),
  }),
});
