import { z } from 'zod';

export const CreateLocationSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nama minimal 3 karakter'),
    code: z.string().min(1, 'Kode harus diisi').max(10, 'Kode maksimal 10 karakter'),
    description: z.string().optional(),
  }),
});

export const GetAllLocationSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    sort: z.string().optional(),
  }),
});

export const GetLocationByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID harus berupa UUID valid'),
  }),
});

export const UpdateLocationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID harus berupa UUID valid'),
  }),
  body: z.object({
    name: z.string().min(3, 'Nama minimal 3 karakter').optional(),
    code: z.string().max(10, 'Kode maksimal 10 karakter').optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const DeleteLocationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID harus berupa UUID valid'),
  }),
});
