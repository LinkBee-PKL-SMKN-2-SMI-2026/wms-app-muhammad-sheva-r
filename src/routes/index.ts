import { Router } from 'express';
import auth from './auth.route';
import dashboard from './dashboard.route';

const router = Router();

router.use('/auth', auth);

router.use('/dashboard', dashboard);

export default router;