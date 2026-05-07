import express from 'express';
import * as applicationController from '../controllers/instructorApplicationController';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = express.Router();

// User routes
router.post('/apply', protect, applicationController.submitApplication);

// Admin routes
router.get('/', protect, authorize(UserRole.ADMIN), applicationController.getAllApplications);
router.get('/:id', protect, authorize(UserRole.ADMIN), applicationController.getApplicationById);
router.patch('/:id/process', protect, authorize(UserRole.ADMIN), applicationController.processApplication);

export default router;
