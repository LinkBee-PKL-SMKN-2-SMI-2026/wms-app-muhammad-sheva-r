import { type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { type AuthRequest } from '../models/auth.model';
import { catchAsync } from '../utils/catchAsync';
import type { GetActivityLogsQuery } from '../models/activity-log.dto';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export const getActivityLogs = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit, userId, action, entity, startDate, endDate } =
    req.query as unknown as GetActivityLogsQuery;
  const where: Record<string, unknown> = {};

  if (userId) {
    where.userId = userId;
  }
  if (action) {
    where.action = action;
  }
  if (entity) {
    where.entity = entity;
  }
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.activity_Logs.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activity_Logs.count({ where }),
  ]);

  const formattedLogs = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    detail: log.detail,
    userName: log.user.name,
    createdAt: log.createdAt,
  }));

  res.status(200).json({
    data: formattedLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
