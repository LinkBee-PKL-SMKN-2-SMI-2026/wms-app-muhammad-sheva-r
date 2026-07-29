import type { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { AppError } from '../utils/AppError';
import type { AuthRequest } from './authenticate.middleware';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const authorize = (...roles: string[]) => {
  return async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        return next(new AppError('Unauthorized', 401));
      }

      const user = await prisma.users.findUnique({
        where: { id: req.user.userId },
        select: { role: true },
      });

      if (!user) {
        return next(new AppError('User tidak ditemukan', 404));
      }

      if (!roles.includes(user.role)) {
        return next(
          new AppError('Forbidden: Anda tidak memiliki akses ke resource ini', 403)
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};