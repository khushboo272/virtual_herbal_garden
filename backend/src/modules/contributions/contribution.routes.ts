import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { contributionController } from './contribution.controller';
import { authenticate } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';
import { validate } from '../../core/middleware/validate';
import { UserRole } from '../../types';
import {
  contributionQuerySchema,
  correctionRequestSchema,
} from './contribution.validators';

const router = Router();

// Rate limiter for submit endpoints
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.sub || req.ip || 'anonymous',
  message: {
    success: false,
    error: {
      code: 'SUBMIT_RATE_LIMIT',
      message: 'Too many submissions. Please wait before submitting more items.',
    },
  },
});

router.use(authenticate(), requireRole(UserRole.BOTANIST));

router.get('/summary', contributionController.getSummary);
router.get('/', validate(contributionQuerySchema, 'query'), contributionController.list);
router.get('/:type/:id', contributionController.getOne);
router.post('/:type/:id/submit', submitLimiter, contributionController.submit);
router.post('/:type/:id/withdraw', contributionController.withdraw);
router.delete('/:type/:id', contributionController.delete);
router.post(
  '/:type/:id/correction-request',
  validate(correctionRequestSchema),
  contributionController.requestCorrection,
);

export default router;
