import { type Request, type Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const createLocation = catchAsync(async (req: Request, res: Response) => {
  const { name, code, description } = req.body;

  const existingCode = await prisma.locations.findUnique({ where: { code } });
  if (existingCode) {
    throw new AppError('Kode lokasi sudah digunakan', 400);
  }

  const location = await prisma.locations.create({
    data: { name, code, description },
  });

  res.status(201).json({
    success: true,
    message: 'Lokasi berhasil dibuat',
    data: location,
  });
});

export const getAllLocations = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = (req.query.search as string) || '';
  const sort = (req.query.sort as string) || 'createdAt';

  const skip = (page - 1) * limit;

  const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

  const [locations, total] = await Promise.all([
    prisma.locations.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort]: 'asc' },
    }),
    prisma.locations.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: locations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const getLocationById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const location = await prisma.locations.findUnique({
    where: { id },
  });

  if (!location) {
    throw new AppError('Lokasi tidak ditemukan', 404);
  }

  res.status(200).json({
    success: true,
    data: location,
  });
});

export const updateLocation = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, code, description, isActive } = req.body;

  if (code) {
    const existingCode = await prisma.locations.findFirst({
      where: { code, NOT: { id } },
    });
    if (existingCode) {
      throw new AppError('Kode lokasi sudah digunakan oleh lokasi lain', 400);
    }
  }

  const location = await prisma.locations.update({
    where: { id },
    data: { name, code, description, isActive },
  });

  res.status(200).json({
    success: true,
    message: 'Lokasi berhasil diperbarui',
    data: location,
  });
});

export const deleteLocation = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const productCount = await prisma.products.count({
    where: { locationId: id },
  });

  if (productCount > 0) {
    throw new AppError('Gagal menghapus: Masih ada produk yang berada di lokasi ini', 400);
  }

  await prisma.locations.delete({ where: { id } });

  res.status(200).json({
    success: true,
    message: 'Lokasi berhasil dihapus',
  });
});