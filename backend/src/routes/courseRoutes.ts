import { Router } from 'express';
import * as courseController from '../controllers/courseController';
import { protect, authorize, optionalProtect } from '../middleware/auth';

const router = Router();

// Protected routes that should not conflict with /:id
router.get('/enrolled', protect, courseController.getEnrolledCourses);
router.get('/management', protect, courseController.getAllCourses);
router.get('/management/:id', protect, courseController.getCourseById);

// Public routes
router.get('/', optionalProtect, courseController.getAllCourses);
router.get('/:id', optionalProtect, courseController.getCourseById);

// Protected routes (strictly required authentication)
router.use(protect);
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
