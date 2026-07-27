import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createExample,
  getAllExamples,
} from '../controllers/example.controller';
import { CreateExampleSchema } from '../validations/example.validation';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(CreateExampleSchema),
  createExample
);

router.get('/', authenticate, getAllExamples);

export default router;