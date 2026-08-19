import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { catchAsync } from '../utils/catchAsync';
import type { SummaryResponse, LowStockProduct } from '../models/reporting.dto';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const getSummary = catchAsync(async (req: Request, res: Response) => {
  const dateStr = req.query.date as string | undefined;

  const targetDate = dateStr ? new Date(dateStr) : new Date();

  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const [totalProducts, totalCategories, totalLocations, totalUsers, inboundToday, outboundToday] =
    await Promise.all([
      prisma.products.count(),
      prisma.categories.count(),
      prisma.locations.count(),
      prisma.users.count(),
      prisma.stock_Movements.aggregate({
        where: {
          type: 'INBOUND',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { quantity: true },
      }),
      prisma.stock_Movements.aggregate({
        where: {
          type: 'OUTBOUND',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { quantity: true },
      }),
    ]);

  const summaryData: SummaryResponse = {
    totalProducts,
    totalCategories,
    totalLocations,
    totalStockInboundToday: inboundToday._sum.quantity || 0,
    totalStockOutboundToday: outboundToday._sum.quantity || 0,
    totalUsers,
  };

  return res.status(200).json({
    status: 'success',
    message: 'Summary retrieved successfully',
    data: summaryData,
  });
});

export const getLowStock = catchAsync(async (req: Request, res: Response) => {
  const threshold = Number(req.query.threshold) || 10;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const skip = (page - 1) * limit;

  const whereClause = {
    stock: { lt: threshold },
    isActive: true,
  };

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where: whereClause,
      include: {
        category: { select: { name: true } },
        location: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
      skip,
      take: limit,
    }),
    prisma.products.count({ where: whereClause }),
  ]);

  const formattedProducts: LowStockProduct[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    stock: product.stock,
    minimumStock: product.minimumStock,
    categoryName: product.category.name,
    locationName: product.location.name,
  }));

  return res.status(200).json({
    status: 'success',
    message: 'Low stock products retrieved successfully',
    data: formattedProducts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
