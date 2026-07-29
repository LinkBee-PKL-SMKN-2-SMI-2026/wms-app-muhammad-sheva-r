import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  CreateExampleSchema,
  UpdateExampleSchema,
} from '../validations/example.validation';
import {
  createHandler,
  getAllHandler,
  getByIdHandler,
  updateHandler,
  deleteHandler,
} from '../controllers/example.controller';

const router = Router();

// Endpoint Publik / Terautentikasi (Semua user login)
router.get('/', authenticate, getAllHandler);
router.get('/:id', authenticate, getByIdHandler);

// Endpoint Terproteksi Role ADMIN
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(CreateExampleSchema),
  createHandler
);

router.delete('/:id', authenticate, authorize('ADMIN'), deleteHandler);

// Endpoint Terproteksi Role ADMIN & MANAGER
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  validate(UpdateExampleSchema),
  updateHandler
);

export default router;