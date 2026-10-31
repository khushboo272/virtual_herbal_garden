import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { gardenShowcaseController } from './gardenShowcase.controller';

const router = Router();

const modelErrorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 error reports per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many model error reports. Please try again later.',
    },
  },
});

router.get('/showcase', (req, res, next) => {
  gardenShowcaseController.getShowcase(req, res).catch(next);
});

router.post('/model-error', modelErrorLimiter, (req, res, next) => {
  gardenShowcaseController.reportModelError(req, res).catch(next);
});

export default router;

