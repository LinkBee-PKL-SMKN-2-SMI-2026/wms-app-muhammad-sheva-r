import { Router } from 'express';
feat/task-5
import authRoute from './auth.route';
import reportingRoute from './reporting.route';

import auth from './auth.route';
import dashboard from './dashboard.route';
main

const router = Router();

router.use('/auth', authRoute);
router.use('/reports', reportingRoute);

router.use('/dashboard', dashboard);

export default router;
