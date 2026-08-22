import { Router } from 'express';
import authRoute from './auth.route';
import reportingRoute from './reporting.route';
import dashboard from './dashboard.route';
import category from './category.route';
import location from './location.route';
import product from './product.route';
import movement from './stock-movement.route';

const router = Router();

router.use('/auth', authRoute);
router.use('/reports', reportingRoute);
router.use('/dashboard', dashboard);
router.use('/categories', category);
router.use('/locations', location);
router.use('/products', product);
router.use('/movements', movement);

export default router;
