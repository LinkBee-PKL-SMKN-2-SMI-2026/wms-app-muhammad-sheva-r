import type { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import type { RegisterRequest, LoginRequest } from '../models/auth.dto';
import type { TokenPayload } from '../models/auth.model';
import type { AuthRequest } from '../middlewares/authenticate.middleware';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { logger } from '../utils/logger';
import { logActivity } from '../services/activity-log.service';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as RegisterRequest;

  // 1. Cek email terdaftar
  const existingUser = await prisma.users.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('Email sudah terdaftar', 400);
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Buat user baru
  const user = await prisma.users.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });
  logActivity({ userId: user.id, action: 'CREATE', entity: 'Users', entityId: user.id });
  logger.info(`User registered successfully: ${user.email}`);

  // 4. Generate Tokens
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return res.status(201).json({
    status: 'success',
    message: 'Registrasi berhasil',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginRequest;

  // 1. Cari user berdasarkan email
  const user = await prisma.users.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('Email atau password salah', 401);
  }

  // 2. Verifikasi password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Email atau password salah', 401);
  }

  logActivity({ userId: user.id, action: 'LOGIN', entity: 'Users' });
  logger.info(`User logged in successfully: ${user.email}`);

  // 3. Generate Tokens
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return res.status(200).json({
    status: 'success',
    message: 'Login berhasil',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    },
  });
});

export const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user as TokenPayload;

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User tidak ditemukan', 404);
  }

  logger.info(`Fetched profile for user ID: ${userId}`);

  return res.status(200).json({
    success: true,
    message: 'Data user berhasil diambil',
    data: user,
  });
});
