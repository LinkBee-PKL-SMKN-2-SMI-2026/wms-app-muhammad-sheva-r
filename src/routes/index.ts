import { Router } from 'express';
import authRoute from './auth.route';
import categoryRoute from './category.route';
import locationRoute from './location.route';
import productRoute from './product.route';
import movement from './stock-movement.route';
import activityLogRoute from './activity-log.route';
import dashboardRoute from './dashboard.route';
import reportRoute from './report.route'; // ← tambahkan ini

const router = Router();

router.use('/auth', authRoute);
router.use('/categories', categoryRoute);
router.use('/locations', locationRoute);
router.use('/products', productRoute);
router.use('/movements', movement);
router.use('/activity-logs', activityLogRoute);
router.use('/dashboard', dashboardRoute);
router.use('/reports', reportRoute); // ← tambahkan ini

export default router;