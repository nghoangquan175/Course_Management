import { Router } from 'express';
import * as instructorController from '../controllers/instructorController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);
router.use(authorize('INSTRUCTOR', 'ADMIN'));

router.get('/students', instructorController.getInstructorStudents);
router.get('/stats', instructorController.getInstructorDashboardStats);
router.post('/courses/:courseId/request-edit', instructorController.requestCourseEdit);
router.get('/edit-requests', instructorController.getInstructorEditRequests);

export default router;
