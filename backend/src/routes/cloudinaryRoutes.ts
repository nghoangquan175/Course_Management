import { Router } from 'express';
import * as cloudinaryController from '../controllers/cloudinaryController';
import { protect } from '../middleware/auth';

const router = Router();

// All logged in users can get upload signatures (e.g., users uploading CVs for instructor applications)
router.get('/signature', protect, cloudinaryController.getSignature);
router.get('/signed-url', protect, cloudinaryController.getSignedUrl);

export default router;
