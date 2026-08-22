import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import {
  CreateCategorySchema,
  GetAllCategorySchema,
  GetCategoryByIdSchema,
  UpdateCategorySchema,
  DeleteCategorySchema,
} from '../validations/category.validation';
import {
  CreateCategory,
  GetAllCategories,
  GetCategoryById,
  UpdateCategory,
  DeleteCategory,
} from '../controllers/category.controller';
import { AppError } from '../utils/AppError';

const router = Router();

router.use(authenticate);

router
  .route('/')
  .post(authorize('ADMIN'), validate(CreateCategorySchema), CreateCategory)
  .get(validate(GetAllCategorySchema), GetAllCategories);

router
  .route('/:id')
  .get(validate(GetCategoryByIdSchema), GetCategoryById)
  .put(authorize('ADMIN'), validate(UpdateCategorySchema), UpdateCategory)
  .delete(authorize('ADMIN'), validate(DeleteCategorySchema), DeleteCategory);

router.all('/*path', () => {
  throw new AppError('Method tidak diizinkan pada route ini', 405);
});

export default router;
