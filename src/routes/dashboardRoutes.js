import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.js';
import { authRequired, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/user', authRequired, DashboardController.user);
router.get('/admin', authRequired, requireAdmin, DashboardController.admin);
export default router;