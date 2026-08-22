import { type Request, type Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const { name, sku, description, stock, minimumStock, categoryId, locationId } = req.body;

  // Manual Check FK
  const categoryExists = await prisma.categories.findUnique({ where: { id: categoryId } });
  if (!categoryExists) {
    throw new AppError('Kategori tidak ditemukan', 404);
  }

  const locationExists = await prisma.locations.findUnique({ where: { id: locationId } });
  if (!locationExists) {
    throw new AppError('Lokasi tidak ditemukan', 404);
  }

  const skuExists = await prisma.products.findUnique({ where: { sku } });
  if (skuExists) {
    throw new AppError('SKU produk sudah digunakan', 400);
  }

  const product = await prisma.products.create({
    data: {
      name,
      sku,
      description,
      stock,
      minimumStock,
      categoryId,
      locationId,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Produk berhasil dibuat',
    data: product,
  });
});

export const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = (req.query.search as string) || '';
  const sort = (req.query.sort as string) || 'createdAt';
  const categoryId = req.query.categoryId as string;
  const locationId = req.query.locationId as string;

  const skip = (page - 1) * limit;

  const where: Prisma.ProductsWhereInput = {};
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (locationId) {
    where.locationId = locationId;
  }

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort]: 'asc' },
      include: {
        category: true,
        location: true,
      },
    }),
    prisma.products.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const getProductById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const product = await prisma.products.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
    },
  });

  if (!product) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, sku, description, minimumStock, categoryId, locationId } = req.body;

  if (sku) {
    const skuExists = await prisma.products.findFirst({
      where: { sku, NOT: { id } },
    });
    if (skuExists) {
      throw new AppError('SKU sudah digunakan oleh produk lain', 400);
    }
  }

  if (categoryId) {
    const categoryExists = await prisma.categories.findUnique({ where: { id: categoryId } });
    if (!categoryExists) {
      throw new AppError('Kategori tidak ditemukan', 404);
    }
  }

  if (locationId) {
    const locationExists = await prisma.locations.findUnique({ where: { id: locationId } });
    if (!locationExists) {
      throw new AppError('Lokasi tidak ditemukan', 404);
    }
  }

  const product = await prisma.products.update({
    where: { id },
    data: { name, sku, description, minimumStock, categoryId, locationId },
  });

  res.status(200).json({
    success: true,
    message: 'Produk berhasil diperbarui',
    data: product,
  });
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const movementCount = await prisma.stock_Movements.count({
    where: { productId: id },
  });

  if (movementCount > 0) {
    throw new AppError(
      'Gagal menghapus: Produk memiliki riwayat pergerakan stok (Stock Movement)',
      400,
    );
  }

  await prisma.products.delete({ where: { id } });

  res.status(200).json({
    success: true,
    message: 'Produk berhasil dihapus',
  });
});
