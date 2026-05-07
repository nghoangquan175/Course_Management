import { Router } from 'express';
import * as certificateController from '../controllers/certificateController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.post('/generate', certificateController.generateCertificate);
router.get('/:courseId', certificateController.getCertificate);

export default router;
