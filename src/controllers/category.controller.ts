import { type Request, type Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const CreateCategory = catchAsync(async (req: Request, res: Response) => {
  const { name, description } = req.body;

  const duplikat = await prisma.categories.findUnique({ where: { name } });
  if (duplikat) {
    throw new AppError('Nama Kategori sudah digunakan', 400);
  }

  const category = await prisma.categories.create({
    data: { name, description },
  });

  res.status(201).json({
    success: true,
    massage: 'Kategori berhasil dibuat',
    data: category,
  });
});

export const GetAllCategories = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = (req.query.search as string) || '';
  const sort = (req.query.sort as string) || 'createdAt';

  const skip = (page - 1) * limit;

  const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

  const [categories, total] = await Promise.all([
    prisma.categories.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort]: 'asc' },
    }),
    prisma.categories.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: categories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const GetCategoryById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const category = await prisma.categories.findUnique({
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

  res.status(200).json({
    success: true,
    data: category,
  });
});

export const UpdateCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, description, isActive } = req.body;

  if (name) {
    const duplikat = await prisma.categories.findFirst({
      where: { name, NOT: { id } },
    });
    if (duplikat) {
      throw new AppError('Nama kategori sudah digunakan oleh kategori lain', 400);
    }
  }

  const category = await prisma.categories.update({
    where: { id },
    data: { name, description, isActive },
  });

  res.status(200).json({
    success: true,
    message: 'kategori berhasil diperbarui',
    data: category,
  });
});

export const DeleteCategory = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const productcount = await prisma.products.count({
    where: { categoryId: id },
  });

  if (productcount > 0) {
    throw new AppError('Gagal menghapus: kategori masih digunakan oleh produk', 400);
  }

  await prisma.categories.delete({ where: { id } });

  res.status(200).json({
    success: true,
    message: 'kategori berhasil dihapus',
  });
});
