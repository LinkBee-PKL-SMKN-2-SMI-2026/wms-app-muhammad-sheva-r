import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import { AppError } from '../utils/AppError';
import {
  CreateProductSchema,
  GetAllProductSchema,
  GetProductByIdSchema,
  UpdateProductSchema,
  DeleteProductSchema,
} from '../validations/product.validation';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';

const router = Router();

// Proteksi global (harus login)
router.use(authenticate);

// GET All & GET By ID (Semua user terautentikasi)
router.get('/', validate(GetAllProductSchema), getAllProducts);
router.get('/:id', validate(GetProductByIdSchema), getProductById);

// POST, PUT, DELETE (Hanya ADMIN / MANAGER)
router.post('/', authorize('ADMIN', 'MANAGER'), validate(CreateProductSchema), createProduct);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(UpdateProductSchema), updateProduct);
router.delete('/:id', authorize('ADMIN'), validate(DeleteProductSchema), deleteProduct);

// Handle Method Not Allowed untuk endpoint tak dikenal
router.all('/*path', () => {
  throw new AppError('Method tidak diizinkan pada route ini', 405);
});

export default router;