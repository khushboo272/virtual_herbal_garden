import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { supportController } from './support.controller';
import { authenticate } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';
import { validate } from '../../core/middleware/validate';
import { UserRole } from '../../types';
import { createSupportRequestSchema } from './support.validators';

const router = Router();

// Rate limiter: 3 requests per hour
const supportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.sub || req.ip || 'anonymous',
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'You can submit at most 3 support requests per hour. Please try again later.',
    },
  },
});

router.use(authenticate(), requireRole(UserRole.USER));

router.post(
  '/requests',
  supportLimiter,
  validate(createSupportRequestSchema),
  supportController.create,
);

router.get('/requests/mine', supportController.getMine);

export default router;
