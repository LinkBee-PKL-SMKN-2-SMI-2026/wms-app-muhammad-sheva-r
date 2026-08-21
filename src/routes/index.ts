import { Router } from 'express';
import authRoute from './auth.route';
import reportingRoute from './reporting.route';
import dashboard from './dashboard.route';

const router = Router();

router.use('/auth', authRoute);
router.use('/reports', reportingRoute);
router.use('/dashboard', dashboard);

export default router;
