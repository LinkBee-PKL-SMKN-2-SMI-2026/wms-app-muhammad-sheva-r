import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/jwt';
import type { AuthRequest } from '../models/auth.model';

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Akses ditolak. Token tidak ditemukan', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token as string);
    (req as AuthRequest).user = payload;
    next();
  } catch (error) {
    throw new AppError('Token tidak valid atau sudah kadaluwarsa', 401);
  }
};