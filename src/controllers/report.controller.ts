import type { Response } from 'express';
// dashboard.controller.ts (yang sudah terbukti jalan normal)
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import type { AuthRequest } from '../models/auth.model';
import type { LowStockProduct, SummaryResponse } from '../models/reporting.dto';
import { catchAsync } from '../utils/catchAsync';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * 1. FUNGSI GET SUMMARY (REKAP DATA GUDANG HARIAN)
 */
export const getSummary = catchAsync(async (req: AuthRequest, res: Response) => {
  const { date } = req.query;
  const targetDate = date ? new Date(date as string) : new Date();

  const startOfDay = new Date(targetDate.getTime());
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate.getTime());
  endOfDay.setHours(23, 59, 59, 999);

  const [totalProducts, totalCategories, totalLocations, totalUsers, inboundToday, outboundToday] =
    await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.location.count(),
      prisma.user.count(),

      // FIX: enum MovementType nilainya 'IN', bukan 'INBOUND'
      prisma.stockMovement.aggregate({
        where: {
          type: 'IN',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { quantity: true },
      }),

      // FIX: enum MovementType nilainya 'OUT', bukan 'OUTBOUND'
      prisma.stockMovement.aggregate({
        where: {
          type: 'OUT',
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

  res.status(200).json({
    success: true,
    message: 'Summary retrieved successfully',
    data: summaryData,
  });
});

/**
 * 2. FUNGSI GET LOW STOCK (PERINGATAN STOK TIPIS)
 */
export const getLowStock = catchAsync(async (req: AuthRequest, res: Response) => {
  const { threshold = 10, page = 1, limit = 10 } = req.query;

  const thresholdNum = Number(threshold);
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const skip = (pageNum - 1) * limitNum;

  const [products, totalItems] = await Promise.all([
    prisma.product.findMany({
      where: {
        stock: { lt: thresholdNum },
        // FIX: field isActive tidak ada di model Product, jadi dihapus
      },
      include: {
        category: { select: { name: true } },
        location: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
      skip,
      take: limitNum,
    }),

    prisma.product.count({
      where: {
        stock: { lt: thresholdNum },
        // FIX: field isActive tidak ada di model Product, jadi dihapus
      },
    }),
  ]);

  const formattedProducts: LowStockProduct[] = products.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    stock: item.stock,
    minimumStock: item.minimumStock,
    categoryName: item.category.name,
    locationName: item.location.name,
  }));

  res.status(200).json({
    success: true,
    message: 'Low stock products retrieved successfully',
    data: formattedProducts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum),
    },
  });
});
