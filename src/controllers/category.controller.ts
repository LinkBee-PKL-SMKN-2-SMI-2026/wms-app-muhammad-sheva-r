import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// 1. Create Category
export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const { name, description } = req.body;

  const existingCategory = await prisma.category.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  });

  if (existingCategory) {
    throw new AppError('Nama kategori sudah digunakan', 400);
  }

  const category = await prisma.category.create({
    data: { name, description },
  });

  return res.status(201).json({
    status: 'success',
    message: 'Kategori berhasil dibuat',
    data: category,
  });
});

// 2. Get All Categories
export const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = (req.query.search as string) || '';
  const sort = (req.query.sort as string) || 'createdAt';

  const skip = (page - 1) * limit;

  const whereClause = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { [sort]: 'desc' },
    }),
    prisma.category.count({ where: whereClause }),
  ]);

  return res.status(200).json({
    status: 'success',
    data: categories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// 3. Get Category By ID
export const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new AppError('Kategori tidak ditemukan', 404);
  }

  return res.status(200).json({
    status: 'success',
    data: category,
  });
});

// 4. Update Category
export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, description, isActive } = req.body;

  const existingCategory = await prisma.category.findUnique({ where: { id } });
  if (!existingCategory) {
    throw new AppError('Kategori tidak ditemukan', 404);
  }

  if (name && name.toLowerCase() !== existingCategory.name.toLowerCase()) {
    const duplicate = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        NOT: { id },
      },
    });

    if (duplicate) {
      throw new AppError('Nama kategori sudah digunakan', 400);
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: { name, description, isActive },
  });

  return res.status(200).json({
    status: 'success',
    message: 'Kategori berhasil diperbarui',
    data: updatedCategory,
  });
});

// 5. Delete Category
export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new AppError('Kategori tidak ditemukan', 404);
  }

  if (category._count.products > 0) {
    throw new AppError('Kategori tidak dapat dihapus karena masih terhubung dengan produk', 400);
  }

  await prisma.category.delete({ where: { id } });

  return res.status(200).json({
    status: 'success',
    message: 'Kategori berhasil dihapus',
  });
});