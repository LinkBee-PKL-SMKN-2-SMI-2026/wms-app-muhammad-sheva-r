import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import { AppError } from '../utils/AppError';
import {
  CreateLocationSchema,
  GetAllLocationSchema,
  GetLocationByIdSchema,
  UpdateLocationSchema,
  DeleteLocationSchema,
} from '../validations/location.validation';
import {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
} from '../controllers/location.controller';

const router = Router();

router.use(authenticate);

router.get('/', validate(GetAllLocationSchema), getAllLocations);
router.get('/:id', validate(GetLocationByIdSchema), getLocationById);

router.post('/', authorize('ADMIN', 'MANAGER'), validate(CreateLocationSchema), createLocation);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(UpdateLocationSchema), updateLocation);
router.delete('/:id', authorize('ADMIN'), validate(DeleteLocationSchema), deleteLocation);

router.all('/*path', () => {
  throw new AppError('Method tidak diizinkan pada route ini', 405);
});

export default router;