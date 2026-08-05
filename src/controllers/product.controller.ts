import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// 1. Create Product
export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const { name, sku, description, stock, minimumStock, categoryId, locationId } = req.body;

  // Cek duplikat SKU
  const existingSku = await prisma.products.findFirst({
    where: { sku: { equals: sku, mode: 'insensitive' } },
  });

  if (existingSku) {
    throw new AppError('SKU sudah digunakan oleh produk lain', 400);
  }

  // Foreign key check manual: Validasi categoryId
  const categoryExists = await prisma.categories.findUnique({
    where: { id: categoryId },
  });
  if (!categoryExists) {
    throw new AppError('Kategori tidak ditemukan', 404);
  }

  // Foreign key check manual: Validasi locationId
  const locationExists = await prisma.locations.findUnique({
    where: { id: locationId },
  });
  if (!locationExists) {
    throw new AppError('Lokasi tidak ditemukan', 404);
  }

  const product = await prisma.products.create({
    data: {
      name,
      sku,
      description,
      stock: stock ?? 0,
      minimumStock: minimumStock ?? 0,
      categoryId,
      locationId,
    },
    include: {
      category: true,
      location: true,
    },
  });

  return res.status(201).json({
    status: 'success',
    message: 'Produk berhasil dibuat',
    data: product,
  });
});

// 2. Get All Products
export const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = (req.query.search as string) || '';
  const sort = (req.query.sort as string) || 'createdAt';
  const categoryId = req.query.categoryId as string | undefined;
  const locationId = req.query.locationId as string | undefined;

  const skip = (page - 1) * limit;

  // Filter gabungan
  const whereClause: any = {};

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  if (locationId) {
    whereClause.locationId = locationId;
  }

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { [sort]: 'desc' },
      include: {
        category: true,
        location: true,
      },
    }),
    prisma.products.count({ where: whereClause }),
  ]);

  return res.status(200).json({
    status: 'success',
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// 3. Get Product By ID
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

  return res.status(200).json({
    status: 'success',
    data: product,
  });
});

// 4. Update Product
export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, sku, description, minimumStock, categoryId, locationId, isActive } = req.body;

  const existingProduct = await prisma.products.findUnique({ where: { id } });
  if (!existingProduct) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  // Cek duplikat SKU jika diubah
  if (sku && sku.toLowerCase() !== existingProduct.sku.toLowerCase()) {
    const duplicateSku = await prisma.products.findFirst({
      where: {
        sku: { equals: sku, mode: 'insensitive' },
        NOT: { id },
      },
    });

    if (duplicateSku) {
      throw new AppError('SKU sudah digunakan oleh produk lain', 400);
    }
  }

  // Validasi categoryId jika diubah
  if (categoryId && categoryId !== existingProduct.categoryId) {
    const categoryExists = await prisma.categories.findUnique({ where: { id: categoryId } });
    if (!categoryExists) {
      throw new AppError('Kategori tidak ditemukan', 404);
    }
  }

  // Validasi locationId jika diubah
  if (locationId && locationId !== existingProduct.locationId) {
    const locationExists = await prisma.locations.findUnique({ where: { id: locationId } });
    if (!locationExists) {
      throw new AppError('Lokasi tidak ditemukan', 404);
    }
  }

  const updatedProduct = await prisma.products.update({
    where: { id },
    data: {
      name,
      sku,
      description,
      minimumStock,
      categoryId,
      locationId,
      isActive,
    },
    include: {
      category: true,
      location: true,
    },
  });

  return res.status(200).json({
    status: 'success',
    message: 'Produk berhasil diperbarui',
    data: updatedProduct,
  });
});

// 5. Delete Product
export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const product = await prisma.products.findUnique({
    where: { id },
    include: {
      _count: {
        select: { stockMovements: true },
      },
    },
  });

  if (!product) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  // Cek apakah ada Stock Movement terkait
  if (product._count && product._count.stockMovements > 0) {
    throw new AppError(
      'Produk tidak dapat dihapus karena memiliki riwayat pergerakan stok (Stock Movement)',
      400
    );
  }

  await prisma.products.delete({ where: { id } });

  return res.status(200).json({
    status: 'success',
    message: 'Produk berhasil dihapus',
  });
});

// 6. Get Product Stock Info (Langkah 6)
export const getProductStockInfo = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const product = await prisma.products.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      minimumStock: true,
    },
  });

  if (!product) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  // Menentukan status stok
  let status: 'safe' | 'low' | 'out' = 'safe';

  if (product.stock === 0) {
    status = 'out';
  } else if (product.stock <= product.minimumStock) {
    status = 'low';
  }

  return res.status(200).json({
    productId: product.id,
    name: product.name,
    sku: product.sku,
    currentStock: product.stock,
    minimumStock: product.minimumStock,
    status,
  });
});