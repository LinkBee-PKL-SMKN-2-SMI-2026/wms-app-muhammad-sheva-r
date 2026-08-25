import { Router } from 'express';
import authRoute from './auth.route';
import categoryRoute from './category.route';
import locationRoute from './location.route';
import productRoute from './product.route';
import movement from './stock-movement.route';
// 1. Tambahkan import untuk route activity log
import activityLogRoute from './activity-log.route'; 

const router = Router();

router.use('/auth', authRoute);
router.use('/categories', categoryRoute);
router.use('/locations', locationRoute);
router.use('/products', productRoute);
router.use('/movements', movement);
// 2. Daftarkan path-nya di sini
router.use('/activity-logs', activityLogRoute);

export default router;