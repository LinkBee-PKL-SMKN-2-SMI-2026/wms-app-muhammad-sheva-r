import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { catchAsync } from '../utils/catchAsync';
import type {
  SummaryResponse,
  LowStockProduct,
  GetSummaryQuery,
  GetLowStockQuery,
} from '../models/reporting.dto';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const getSummary = catchAsync(async (req: Request, res: Response) => {
  const { date } = (req.query as GetSummaryQuery) || {};

  const baseDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(baseDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(baseDate);
  endOfDay.setHours(23, 59, 59, 999);

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
  const { threshold, page, limit } = (req.query as unknown as GetLowStockQuery) || {};

  const thresholdNum = Number(threshold) || 10;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;

  const skip = (pageNum - 1) * limitNum;

  const whereClause = {
    stock: { lt: thresholdNum },
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
      take: limitNum,
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
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});
