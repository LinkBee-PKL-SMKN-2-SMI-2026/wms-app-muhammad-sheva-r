import type { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { catchAsync } from '../utils/catchAsync';
import { logger } from '../utils/logger';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as RegisterRequest;

  // Trik: Gunakan findFirst dan paksa format String() untuk membungkam error Prisma
  const existingUser = await prisma.user.findFirst({
    where: { email: String(email) },
  });

  if (existingUser) {
    throw new AppError('Email sudah terdaftar', 400);
  }

  const hashedPassword = await bcrypt.hash(String(password), 10);

  const user = await prisma.user.create({
    data: {
      name: String(name),
      email: String(email),
      password: hashedPassword,
    },
  });

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

  // Trik: Gunakan findFirst di sini juga
  const user = await prisma.user.findFirst({
    where: { email: String(email) },
  });

  if (!user) {
    throw new AppError('Email atau password salah', 401);
  }

  if (!user.isActive) {
    throw new AppError('Akun anda tidak aktif', 403);
  }

  const isPasswordValid = await bcrypt.compare(String(password), user.password);

  if (!isPasswordValid) {
    throw new AppError('Email atau password salah', 401);
  }

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

export const getMe = catchAsync((req: Request, res: Response) => {
  const currentUser = (req as Request & { user?: unknown }).user;

  if (!currentUser) {
    throw new AppError('Anda belum login atau token tidak valid', 401);
  }

  res.status(200).json({
    status: 'success',
    message: 'Berhasil mengambil data profil',
    data: {
      user: currentUser,
    },
  });
});
