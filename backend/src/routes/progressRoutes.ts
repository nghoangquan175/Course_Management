import { Router } from 'express';
import * as progressController from '../controllers/progressController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/:courseId', progressController.getCourseProgress);
router.patch('/', progressController.updateProgress);

export default router;
