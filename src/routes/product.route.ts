import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';

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

router.use(authenticate);

router
  .route('/')
  .post(authorize('ADMIN'), validate(CreateProductSchema), createProduct)
  .get(validate(GetAllProductSchema), getAllProducts);

router
  .route('/:id')
  .get(validate(GetProductByIdSchema), getProductById)
  .put(authorize('ADMIN'), validate(UpdateProductSchema), updateProduct)
  .delete(authorize('ADMIN'), validate(DeleteProductSchema), deleteProduct);

router.all('/*', (_req, res) => {
  res.status(405).json({ success: false, message: 'Method Not Allowed' });
});
//test
export default router;
