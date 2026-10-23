import { Router } from 'express';
import { tourController } from './tour.controller';
import { authenticate } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';
import { validate } from '../../core/middleware/validate';
import { uploadSingle } from '../../core/middleware/upload';
import { UserRole } from '../../types';
import {
  createTourSchema,
  updateTourSchema,
  tourQuerySchema,
  quizAnswerSchema,
  progressSyncSchema,
  ratingSchema,
} from './tour.validators';

const router = Router();

// ── Public tours list ────────────────────────────────────────────────────────
router.get('/', validate(tourQuerySchema, 'query'), tourController.list);

// ── User progress (static /me routes BEFORE /:slugOrId) ──────────────────────
router.get('/me/progress', authenticate(), tourController.getMeProgress);

// ── Admin management & analytics (static /admin routes BEFORE /:slugOrId) ────
router.get('/admin/list', authenticate(), requireRole(UserRole.ADMIN), tourController.getAdminList);
router.get('/admin/analytics', authenticate(), requireRole(UserRole.ADMIN), tourController.getAdminAnalytics);
router.get('/:id/analytics', authenticate(), requireRole(UserRole.ADMIN), tourController.getTourAnalytics);

// ── Admin mutations ─────────────────────────────────────────────────────────
router.post('/', authenticate(), requireRole(UserRole.ADMIN), validate(createTourSchema), tourController.create);
router.patch('/:id/publish', authenticate(), requireRole(UserRole.ADMIN), tourController.publish);
router.post('/:id/publish', authenticate(), requireRole(UserRole.ADMIN), tourController.publish);
router.patch('/:id/unpublish', authenticate(), requireRole(UserRole.ADMIN), tourController.unpublish);
router.patch('/:id', authenticate(), requireRole(UserRole.ADMIN), validate(updateTourSchema), tourController.update);
router.delete('/:id', authenticate(), requireRole(UserRole.ADMIN), tourController.delete);
router.post('/:id/cover', authenticate(), requireRole(UserRole.ADMIN), uploadSingle, tourController.uploadCover);
router.delete('/:id/cover', authenticate(), requireRole(UserRole.ADMIN), tourController.deleteCover);
router.post('/:id/checkpoints/:key/image', authenticate(), requireRole(UserRole.ADMIN), uploadSingle, tourController.uploadCheckpointImage);

// ── User tour progress mutations ─────────────────────────────────────────────
router.get('/:slug/progress', authenticate(), tourController.getTourProgress);
router.post('/:slug/checkpoints/:key/complete', authenticate(), tourController.completeCheckpoint);
router.post('/:slug/checkpoints/:key/quiz', authenticate(), validate(quizAnswerSchema), tourController.submitQuiz);
router.post('/:slug/progress/sync', authenticate(), validate(progressSyncSchema), tourController.syncProgress);
router.post('/:slug/rating', authenticate(), validate(ratingSchema), tourController.rateTour);
router.delete('/:slug/progress', authenticate(), tourController.restartTour);

// ── Public tour detail (optional auth for draft preview by ADMIN) ────────────
router.get('/:slugOrId', authenticate(true), tourController.getBySlugOrId);

export default router;
