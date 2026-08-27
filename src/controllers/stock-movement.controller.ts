import type { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AppError } from '../utils/AppError';
import type { AuthRequest } from '../models/auth.model';
import type {
  CreateInboundDTO,
  CreateOutboundDTO,
  GetMovementHistoryDTO,
} from '../models/stock-movement.dto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 1. BARANG MASUK (INBOUND)
export const createInbound = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productId, quantity, notes } = req.body as CreateInboundDTO;

    // Ambil userId dari token (di-set oleh middleware authenticate)
    const userPayload = req.user as unknown as Record<string, unknown>;
    const userId = (req.user?.userId || userPayload?.id) as string;

    if (!userId) {
      throw new AppError('User ID tidak ditemukan', 401);
    }

    // Pakai $transaction agar update stok & catat riwayat berjalan 1 paket
    const result = await prisma.$transaction(async (tx) => {
      // a. Update Product.stock -> Tambahkan quantity (increment)
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
      });

      // b. Buat record baru di StockMovement dengan type INBOUND
      const movement = await tx.stockMovement.create({
        data: {
          type: 'INBOUND',
          quantity,
          notes,
          userId,
          productId,
        },
      });

      return { movement, updatedProduct };
    });

    res.status(201).json({
      status: 'success',
      message: 'Barang masuk berhasil dicatat',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// 2. BARANG KELUAR (OUTBOUND)
export const createOutbound = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productId, quantity, notes } = req.body as CreateOutboundDTO;

    const userPayload = req.user as unknown as Record<string, unknown>;
    const userId = (req.user?.userId || userPayload?.id) as string;

    if (!userId) {
      throw new AppError('User ID tidak ditemukan', 401);
    }

    // Cek produk & stok sebelum transaksi
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError('Produk tidak ditemukan', 404);
    }

    // Validasi stok cukup atau tidak
    if (product.stock < quantity) {
      throw new AppError('Stok tidak mencukupi', 400);
    }

    // Pakai $transaction untuk kurangi stok & buat catatan
    const result = await prisma.$transaction(async (tx) => {
      // a. Update Product.stock -> Kurangi quantity (decrement)
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } },
      });

      // b. Buat record baru di StockMovement dengan type OUTBOUND
      const movement = await tx.stockMovement.create({
        data: {
          type: 'OUTBOUND',
          quantity,
          notes,
          userId,
          productId,
        },
      });

      return { movement, updatedProduct };
    });

    res.status(201).json({
      status: 'success',
      message: 'Barang keluar berhasil dicatat',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// 3. RIWAYAT PERGERAKAN STOK (HISTORY)
export const getMovementHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = req.query as unknown as GetMovementHistoryDTO;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter dinamis berdasarkan query params
    const whereCondition: Record<string, unknown> = {};

    if (query.productId) {
      whereCondition.productId = query.productId;
    }

    if (query.type) {
      whereCondition.type = query.type;
    }

    if (query.startDate || query.endDate) {
      whereCondition.createdAt = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }

    const [movements, totalData] = await prisma.$transaction([
      prisma.stockMovement.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          quantity: true,
          notes: true,
          createdAt: true,
          product: {
            select: {
              name: true,
              sku: true,
            },
          },
          User: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.stockMovement.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(totalData / limit);

    res.status(200).json({
      status: 'success',
      data: movements,
      pagination: {
        page,
        limit,
        totalData,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};
