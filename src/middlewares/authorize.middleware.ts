import type { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AppError } from '../utils/AppError';
import type { AuthRequest } from '../models/auth.model';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const authorize = (...roles: string[]) => {
  return async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError('Unauthorized', 401));
      }

      // Ambil userId menggunakan fallback type assertion
      const userId = req.user.userId || (req.user as any).id;

      if (!userId) {
        return next(new AppError('Unauthorized', 401));
      }

      // Ambil data user dari database berdasarkan userId
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        return next(new AppError('User tidak ditemukan', 404));
      }

      // Cek apakah role user ada di dalam daftar role yang diizinkan
      if (!roles.includes(user.role)) {
        return next(
          new AppError('Akses ditolak. Anda tidak memiliki izin', 403)
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};