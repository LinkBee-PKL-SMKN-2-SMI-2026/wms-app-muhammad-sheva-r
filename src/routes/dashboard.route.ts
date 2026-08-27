// src/routes/dashboard.route.ts
import { Router } from 'express';
import { getDashboardStats, getRecentMovements } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/authenticate.middleware';

const router = Router();

router.get('/stats', authenticate, getDashboardStats);
router.get('/recent-movements', authenticate, getRecentMovements);

export default router;