import { Router } from 'express';
import { ProfileController } from '../controllers/profileController.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.get('/me', authRequired, ProfileController.get);
router.put('/update', authRequired, ProfileController.update);
router.put('/change-password', authRequired, ProfileController.changePassword);
export default router;