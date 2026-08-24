import { z } from 'zod';

export const CreateLocationSchema = z.object({
  body: z.object({
    code: z
      .string({ message: 'Kode lokasi wajib diisi' })
      .min(1, 'Kode lokasi wajib diisi')
      .max(10, 'Kode lokasi maksimal 10 karakter'),
    name: z.string({ message: 'Nama lokasi wajib diisi' }).min(3, 'Nama lokasi minimal 3 karakter'),
  }),
});

export const GetAllLocationSchema = z.object({
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
      sort: z.string().optional(),
    })
    .optional(),
});

export const GetLocationByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID harus berformat UUID valid'),
  }),
});

export const UpdateLocationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID harus berformat UUID valid'),
  }),
  body: z.object({
    code: z
      .string()
      .min(1, 'Kode lokasi tidak boleh kosong')
      .max(10, 'Kode lokasi maksimal 10 karakter')
      .optional(),
    name: z.string().min(3, 'Nama lokasi minimal 3 karakter').optional(),
    isActive: z.boolean().optional(),
  }),
});

export const DeleteLocationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID harus berformat UUID valid'),
  }),
});
