import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', authRequired, AuthController.logout);
router.post('/refresh', AuthController.refresh);
router.get('/me', authRequired, AuthController.me);
export default router;