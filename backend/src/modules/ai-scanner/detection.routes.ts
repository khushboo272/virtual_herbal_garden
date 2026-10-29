import { Router } from 'express';
import { detectionController } from './detection.controller';
import { authenticate } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';
import { validate } from '../../core/middleware/validate';
import { uploadSingle } from '../../core/middleware/upload';
import { requireFeatureFlag } from '../../core/middleware/requireFeatureFlag';
import { UserRole } from '../../types';
import { detectionFeedbackSchema, feedbackQueueQuerySchema } from './detection.validators';

const router = Router();

// Per-user rate limit: ~5 req/min to protect the free Gemini quota
import rateLimit from 'express-rate-limit';
import { redis } from '../../core/config/redis';
const isMock = process.env.REDIS_URL === 'redis://localhost:6379' || (process.env.REDIS_URL || '').includes('mock');
const scanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.sub || req.ip || 'anonymous',
  ...(isMock
    ? {}
    : {
        store: (() => {
          const RedisStore = require('rate-limit-redis');
          return new RedisStore({
            // @ts-expect-error - redis client type mismatch
            sendCommand: (...args: string[]) => redis.call(...args),
            prefix: 'rl:scan:',
          });
        })(),
      }),
  message: {
    success: false,
    error: {
      code: 'SCAN_RATE_LIMIT',
      message: 'Too many scan requests, please wait a minute.',
    },
  },
});

router.post(
  '/detect',
  authenticate(),
  requireRole(UserRole.USER),
  requireFeatureFlag('ai_scanner'),
  scanLimiter,
  uploadSingle,
  detectionController.detect,
);
router.get(
  '/detect/:jobId',
  authenticate(),
  requireRole(UserRole.USER),
  requireFeatureFlag('ai_scanner'),
  detectionController.getDetection,
);
router.get(
  '/history',
  authenticate(),
  requireRole(UserRole.USER),
  requireFeatureFlag('ai_scanner'),
  detectionController.getHistory,
);
router.post(
  '/detect/:id/feedback',
  authenticate(),
  requireRole(UserRole.BOTANIST),
  validate(detectionFeedbackSchema),
  detectionController.addFeedback,
);
router.get(
  '/feedback-queue',
  authenticate(),
  requireRole(UserRole.BOTANIST),
  validate(feedbackQueueQuerySchema, 'query'),
  detectionController.getFeedbackQueue,
);
router.get(
  '/feedback-stats',
  authenticate(),
  requireRole(UserRole.BOTANIST),
  detectionController.getFeedbackStats,
);
router.get('/stats', authenticate(), requireRole(UserRole.ADMIN), detectionController.getStats);

export default router;
