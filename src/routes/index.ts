import { Router } from 'express';
import authRoute from './auth.route';
import reportingRoute from './reporting.route';

const router = Router();

router.use('/auth', authRoute);
router.use('/reports', reportingRoute);

export default router;
