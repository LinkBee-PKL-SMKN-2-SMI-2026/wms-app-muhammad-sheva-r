import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { catchAsync } from '../utils/catchAsync';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const getDateFilter = (period: string): Date => {
  const now = new Date();
  switch (period) {
    case 'today':
      return new Date(now.setHours(0, 0, 0, 0));
    case 'month':
      return new Date(now.setDate(now.getDate() - 30));
    case 'week':
    default:
      return new Date(now.setDate(now.getDate() - 7));
  }
};

export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const period = (req.query.period as string) || 'week';
  const dateFilter = getDateFilter(period);

  const [
    totalProducts,
    totalStockAgg,
    lowStockCount,
    outOfStockCount,
    inboundAgg,
    outboundAgg,
    topMovementsAgg,
    categoryDistributionRaw,
  ] = await Promise.all([
    prisma.products.count({ where: { isActive: true } }),
    prisma.products.aggregate({
      where: { isActive: true },
      _sum: { stock: true },
    }),
    prisma.products.count({
      where: {
        isActive: true,
        stock: { lt: prisma.products.fields.minimumStock },
      },
    }),
    prisma.products.count({
      where: { isActive: true, stock: 0 },
    }),

    prisma.stock_Movements.aggregate({
      where: {
        type: 'INBOUND',
        createdAt: { gte: dateFilter },
      },
      _sum: { quantity: true },
    }),
    prisma.stock_Movements.aggregate({
      where: {
        type: 'OUTBOUND',
        createdAt: { gte: dateFilter },
      },
      _sum: { quantity: true },
    }),

    prisma.stock_Movements.groupBy({
      by: ['productId'],
      where: { createdAt: { gte: dateFilter } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),

    prisma.categories.findMany({
      select: {
        name: true,
        products: {
          where: { isActive: true },
          select: { stock: true },
        },
      },
    }),
  ]);

  const topProductIds = topMovementsAgg.map((item) => item.productId);
  const productsInfo = await prisma.products.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, sku: true },
  });

  const topProducts = topMovementsAgg.map((item) => {
    const product = productsInfo.find((p) => p.id === item.productId);
    return {
      id: item.productId,
      name: product?.name || 'Unknown',
      sku: product?.sku || '-',
      totalMovement: item._sum.quantity || 0,
    };
  });

  const categoryDistribution = categoryDistributionRaw.map((cat) => ({
    categoryName: cat.name,
    productCount: cat.products.length,
    totalStock: cat.products.reduce((acc, curr) => acc + curr.stock, 0),
  }));

  const totalInbound = inboundAgg._sum.quantity || 0;
  const totalOutbound = outboundAgg._sum.quantity || 0;

  return res.status(200).json({
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: {
      overview: {
        totalProducts,
        totalStock: totalStockAgg._sum.stock || 0,
        lowStockCount,
        outOfStockCount,
      },
      movements: {
        totalInbound,
        totalOutbound,
        netMovement: totalInbound - totalOutbound,
      },
      topProducts,
      categoryDistribution,
    },
  });
});

export const getRecentMovements = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [movements, total] = await Promise.all([
    prisma.stock_Movements.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.stock_Movements.count(),
  ]);

  return res.status(200).json({
    success: true,
    message: 'Recent movements retrieved successfully',
    data: movements,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
