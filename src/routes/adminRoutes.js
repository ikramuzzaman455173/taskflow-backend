import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authRequired, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.get('/users', authRequired, requireAdmin, AdminController.listUsers);
router.patch('/users/:id/make-admin', authRequired, requireAdmin, AdminController.makeAdmin);
router.patch('/users/:id/activate', authRequired, requireAdmin, AdminController.activate);
router.patch('/users/:id/deactivate', authRequired, requireAdmin, AdminController.deactivate);
router.delete('/users/:id', authRequired, requireAdmin, AdminController.removeUser);
export default router;