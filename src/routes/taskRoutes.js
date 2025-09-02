import { Router } from 'express';
import { TaskController } from '../controllers/taskController.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.get('/list', authRequired, TaskController.list);
router.get('/summary', authRequired, TaskController.summary);
router.get('/:id', authRequired, TaskController.getOne);
router.post('/create', authRequired, TaskController.create);
router.put('/:id', authRequired, TaskController.update);
router.delete('/:id', authRequired, TaskController.remove);
router.delete('/remove-all', authRequired, TaskController.removeAll);
export default router;
