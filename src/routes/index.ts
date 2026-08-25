import { Router } from 'express';
import authRoute from './auth.route';
import categoryRoute from './category.route';
import locationRoute from './location.route';
import productRoute from './product.route';
import movement from './stock-movement.route';
import reportingRoute from './reporting.route';
import dashboard from './dashboard.route';

const router = Router();

router.use('/auth', authRoute);
router.use('/categories', categoryRoute);
router.use('/locations', locationRoute);
router.use('/products', productRoute);
router.use('/movements', movement);
router.use('/reports', reportingRoute);
router.use('/dashboard', dashboard);

export default router;
