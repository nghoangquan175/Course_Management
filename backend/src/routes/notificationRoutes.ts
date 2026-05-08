import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createAdminNotification,
} from '../controllers/notificationController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

// Admin only
router.post('/admin-send', authorize('ADMIN'), createAdminNotification);

export default router;
