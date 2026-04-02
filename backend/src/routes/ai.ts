import { Router } from 'express';
import { detectionController } from '../controllers/detectionController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { uploadSingle } from '../middleware/upload';
import { detectionLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';
import { detectionFeedbackSchema } from '../validators/detection.validators';

const router = Router();

router.post('/detect', authenticate(), requireRole(UserRole.USER), detectionLimiter, uploadSingle, detectionController.detect);
router.get('/detect/:jobId', authenticate(), requireRole(UserRole.USER), detectionController.getDetection);
router.get('/history', authenticate(), requireRole(UserRole.USER), detectionController.getHistory);
router.post('/detect/:id/feedback', authenticate(), requireRole(UserRole.BOTANIST), validate(detectionFeedbackSchema), detectionController.addFeedback);
router.get('/stats', authenticate(), requireRole(UserRole.ADMIN), detectionController.getStats);

export default router;
