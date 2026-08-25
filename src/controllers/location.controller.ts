import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// 1. Create Location
export const createLocation = catchAsync(async (req: Request, res: Response) => {
  const { code, name } = req.body;

  const existingCode = await prisma.locations.findFirst({
    where: { code: { equals: code, mode: 'insensitive' } },
  });

  if (existingCode) {
    throw new AppError('Kode lokasi sudah digunakan', 400);
  }

  const existingName = await prisma.locations.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  });

  if (existingName) {
    throw new AppError('Nama lokasi sudah digunakan', 400);
  }

  const location = await prisma.locations.create({
    data: { code, name },
  });

  return res.status(201).json({
    status: 'success',
    message: 'Lokasi berhasil dibuat',
    data: location,
  });
});

// 2. Get All Locations
export const getAllLocations = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = (req.query.search as string) || '';
  const sort = (req.query.sort as string) || 'createdAt';

  const skip = (page - 1) * limit;

  const whereClause = search
    ? {
        OR: [
          { code: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [locations, total] = await Promise.all([
    prisma.locations.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { [sort]: 'desc' },
    }),
    prisma.locations.count({ where: whereClause }),
  ]);

  return res.status(200).json({
    status: 'success',
    data: locations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// 3. Get Location By ID
export const getLocationById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const location = await prisma.locations.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!location) {
    throw new AppError('Lokasi tidak ditemukan', 404);
  }

  return res.status(200).json({
    status: 'success',
    data: location,
  });
});

// 4. Update Location
export const updateLocation = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { code, name, isActive } = req.body;

  const existingLocation = await prisma.locations.findUnique({ where: { id } });
  if (!existingLocation) {
    throw new AppError('Lokasi tidak ditemukan', 404);
  }

  if (code && code.toLowerCase() !== existingLocation.code.toLowerCase()) {
    const duplicateCode = await prisma.locations.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        NOT: { id },
      },
    });

    if (duplicateCode) {
      throw new AppError('Kode lokasi sudah digunakan', 400);
    }
  }

  if (name && name.toLowerCase() !== existingLocation.name.toLowerCase()) {
    const duplicateName = await prisma.locations.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        NOT: { id },
      },
    });

    if (duplicateName) {
      throw new AppError('Nama lokasi sudah digunakan', 400);
    }
  }

  const updatedLocation = await prisma.locations.update({
    where: { id },
    data: { code, name, isActive },
  });

  return res.status(200).json({
    status: 'success',
    message: 'Lokasi berhasil diperbarui',
    data: updatedLocation,
  });
});

// 5. Delete Location
export const deleteLocation = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const location = await prisma.locations.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!location) {
    throw new AppError('Lokasi tidak ditemukan', 404);
  }

  if (location._count.products > 0) {
    throw new AppError('Lokasi tidak dapat dihapus karena masih digunakan oleh produk', 400);
  }

  await prisma.locations.delete({ where: { id } });

  return res.status(200).json({
    status: 'success',
    message: 'Lokasi berhasil dihapus',
  });
});
