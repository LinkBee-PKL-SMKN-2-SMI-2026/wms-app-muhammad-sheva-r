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
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError('Unauthorized', 401));
      }

      const userPayload = req.user as unknown as Record<string, unknown>;
      const userId = (req.user.userId || userPayload.id) as string;

      if (!userId) {
        return next(new AppError('Unauthorized', 401));
      }

      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        return next(new AppError('User tidak ditemukan', 404));
      }

      if (!roles.includes(user.role)) {
        return next(new AppError('Akses ditolak. Anda tidak memiliki izin', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
