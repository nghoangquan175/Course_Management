import { Router } from 'express';
import { getLessonExam, upsertExam, deleteExam, submitExam, getMyExamResults, getResultById } from '../controllers/examController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/my-results', getMyExamResults);
router.get('/result/:id', getResultById);
router.get('/lesson/:lessonId', getLessonExam);
router.post('/upsert', authorize('INSTRUCTOR', 'ADMIN'), upsertExam);
router.post('/submit', submitExam);
router.delete('/:id', authorize('INSTRUCTOR', 'ADMIN'), deleteExam);

export default router;
