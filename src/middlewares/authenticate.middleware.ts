import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import type { TokenPayload } from '../models/auth.model';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Akses ditolak. Token tidak ditemukan', 401);
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new AppError('Token tidak valid', 401);
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    throw new AppError('Token tidak valid atau sudah kadaluwarsa', 401);
  }
};