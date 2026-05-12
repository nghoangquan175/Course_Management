import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getEditRequests,
  handleEditRequest,
} from '../controllers/adminController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// All admin routes are protected
router.use(protect);
router.use(authorize('ADMIN'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/edit-requests', getEditRequests);
router.put('/edit-requests/:requestId/handle', handleEditRequest);

export default router;
