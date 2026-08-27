import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import { AppError } from '../utils/AppError';
import {
  CreateCategorySchema,
  GetAllCategorySchema,
  GetCategoryByIdSchema,
  UpdateCategorySchema,
  DeleteCategorySchema,
} from '../validations/category.validation';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';

const router = Router();

// Proteksi global (harus login)
router.use(authenticate);

// GET All & GET By ID (Boleh diakses semua role yang terautentikasi)
router.get('/', validate(GetAllCategorySchema), getAllCategories);
router.get('/:id', validate(GetCategoryByIdSchema), getCategoryById);

// POST, PUT, DELETE (Hanya ADMIN / MANAGER)
router.post('/', authorize('ADMIN', 'MANAGER'), validate(CreateCategorySchema), createCategory);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(UpdateCategorySchema), updateCategory);
router.delete('/:id', authorize('ADMIN'), validate(DeleteCategorySchema), deleteCategory);

// Handle Method Not Allowed untuk endpoint yang tidak ada/cocok
router.all('/*path', () => {
  throw new AppError('Method tidak diizinkan pada route ini', 405);
});

export default router;
