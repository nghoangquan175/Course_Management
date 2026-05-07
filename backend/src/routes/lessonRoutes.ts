import { Router } from 'express';
import * as lessonController from '../controllers/lessonController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);
router.use(authorize('INSTRUCTOR', 'ADMIN'));

router.get('/course/:courseId', lessonController.getCourseLessons);
router.post('/', lessonController.createLesson);
router.patch('/:id', lessonController.updateLesson);
router.delete('/:id', lessonController.deleteLesson);
router.put('/course/:courseId/reorder', lessonController.reorderLessons);

export default router;
