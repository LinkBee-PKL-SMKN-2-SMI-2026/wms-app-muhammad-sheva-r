import type { Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import type { AuthRequest } from '../middlewares/authenticate.middleware';

export const getAllHandler = catchAsync((_req: AuthRequest, res: Response) => {
  return res.status(200).json({
    status: 'success',
    message: 'Berhasil mengambil semua data',
    data: [],
  });
});

export const getByIdHandler = catchAsync((req: AuthRequest, res: Response) => {
  const { id } = req.params;
  return res.status(200).json({
    status: 'success',
    message: 'Berhasil mengambil detail data',
    data: { id },
  });
});

export const createHandler = catchAsync((req: AuthRequest, res: Response) => {
  return res.status(201).json({
    status: 'success',
    message: 'Berhasil membuat data baru',
    data: req.body,
  });
});

export const updateHandler = catchAsync((req: AuthRequest, res: Response) => {
  const { id } = req.params;
  return res.status(200).json({
    status: 'success',
    message: 'Berhasil memperbarui data',
    data: { id, ...req.body },
  });
});

export const deleteHandler = catchAsync((_req: AuthRequest, res: Response) => {
  return res.status(200).json({
    status: 'success',
    message: 'Berhasil menghapus data',
  });
});
