import { Router } from 'express';
import * as cloudinaryController from '../controllers/cloudinaryController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Only logged in users (instructors/admins) can get upload signatures
router.get('/signature', protect, authorize('INSTRUCTOR', 'ADMIN'), cloudinaryController.getSignature);

export default router;
