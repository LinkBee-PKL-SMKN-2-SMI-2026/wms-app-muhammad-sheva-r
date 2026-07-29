import { z } from 'zod';

// Skema untuk Query Params (Get All)
export const GetAllExampleSchema = z.object({
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
    })
    .optional(),
});

// Skema untuk URL Params (Get By ID & Delete)
export const GetExampleByIdSchema = z.object({
  params: z.object({
    id: z.string({ message: 'ID wajib diisi' }),
  }),
});

export const DeleteExampleSchema = z.object({
  params: z.object({
    id: z.string({ message: 'ID wajib diisi' }),
  }),
});

// Skema untuk Body (Create & Update)
export const CreateExampleSchema = z.object({
  body: z.object({
    title: z.string({ message: 'Title wajib diisi' }),
    description: z.string().optional(),
  }),
});

export const UpdateExampleSchema = z.object({
  params: z.object({
    id: z.string({ message: 'ID wajib diisi' }),
  }),
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const PartialUpdateExampleSchema = UpdateExampleSchema;

// Skema Tambahan
export const BulkCreateExampleSchema = z.object({
  body: z.array(
    z.object({
      title: z.string({ message: 'Title wajib diisi' }),
      description: z.string().optional(),
    })
  ),
});

export const CreateExampleWithItemsSchema = z.object({
  body: z.object({
    title: z.string({ message: 'Title wajib diisi' }),
    description: z.string().optional(),
    items: z.array(z.string()).optional(),
  }),
});