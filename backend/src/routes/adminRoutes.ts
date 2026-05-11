import { Router } from 'express';
import { getDashboardStats, getAllUsers } from '../controllers/adminController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// All admin routes are protected
router.use(protect);
router.use(authorize('ADMIN'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/users', getAllUsers);

export default router;
