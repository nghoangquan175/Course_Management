import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Publicly available to anyone who wants to browse categories
router.get('/', categoryController.getAllCategories);

// Only admins can create new categories
router.post('/', protect, authorize('ADMIN'), categoryController.createCategory);

export default router;
