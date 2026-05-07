import { Router } from 'express';
import * as courseController from '../controllers/courseController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// All routes here require authentication
router.use(protect);

// Routes accessible by all authenticated users (Students, Instructors, Admins)
router.get('/enrolled', courseController.getEnrolledCourses);
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.get('/lessons/:lessonId', courseController.getLessonDetail);
router.post('/:id/enroll', courseController.enrollCourse);

// Restrict following routes to Instructors and Admins only
router.use(authorize('INSTRUCTOR', 'ADMIN'));

router.post('/', courseController.createCourse);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);
router.post('/:id/restore', courseController.restoreCourse);

// Workflow actions (Instructor/Admin)
router.post('/:id/submit', courseController.submitForApproval);
router.post('/:id/withdraw', courseController.withdrawCourse);
router.post('/:id/request-edit', courseController.requestEdit);

// Admin only actions
router.post('/:id/approve', authorize('ADMIN'), courseController.approveCourse);
router.post('/:id/reject', authorize('ADMIN'), courseController.rejectCourse);
router.post('/:id/publish', authorize('ADMIN'), courseController.publishCourse);
router.post('/:id/unpublish', authorize('ADMIN'), courseController.unpublishCourse);

export default router;
