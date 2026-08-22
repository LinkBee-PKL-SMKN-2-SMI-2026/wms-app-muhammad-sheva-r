import { z } from 'zod';

export const CreateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nama Minim 3 Karakter'),
    description: z.string().optional(),
  }),
});

export const GetAllCategorySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    sort: z.string().optional(),
  }),
});

export const GetCategoryByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID harus UUID valid'),
  }),
});

export const UpdateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('ID harus UUID valid'),
  }),
  body: z.object({
    name: z.string().min(3, 'Nama Minim 3 Karakter').optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const DeleteCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('ID harus UUID valid'),
  }),
});