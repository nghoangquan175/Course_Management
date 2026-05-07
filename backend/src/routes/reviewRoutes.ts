import { Router } from 'express';
import * as reviewController from '../controllers/reviewController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/', protect, reviewController.createReview);
router.get('/course/:courseId', reviewController.getCourseReviews);

export default router;
