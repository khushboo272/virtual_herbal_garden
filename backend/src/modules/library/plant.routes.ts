import { Router } from 'express';
import { plantController } from './plant.controller';
import { authenticate } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';
import { validate } from '../../core/middleware/validate';
import { uploadMultiple, uploadGLB } from '../../core/middleware/upload';
import { UserRole } from '../../types';
import {
  createPlantSchema,
  updatePlantSchema,
  plantQuerySchema,
  plantReviewSchema,
} from './plant.validators';

const router = Router();

// ── Public routes ──────────────────────────────────────────────────────────
// API base path /api/v1/plants is preserved (set in routes/index.ts)
router.get('/', validate(plantQuerySchema, 'query'), plantController.list);
router.get('/featured', plantController.featured);
router.get('/search/autocomplete', plantController.autocomplete);
router.get('/garden', plantController.getGardenPlants);
// :slug accepts both slug strings and Mongo ObjectIds
router.get('/:slug', authenticate(true), plantController.getBySlug);
router.get('/:id/related', plantController.getRelated);
router.get('/:id/reviews', plantController.getReviews);

// ── Protected routes ───────────────────────────────────────────────────────
router.post(
  '/',
  authenticate(),
  requireRole(UserRole.BOTANIST),
  validate(createPlantSchema),
  plantController.create,
);
router.patch(
  '/:id',
  authenticate(),
  requireRole(UserRole.BOTANIST),
  validate(updatePlantSchema),
  plantController.update,
);
router.post('/:id/publish', authenticate(), requireRole(UserRole.ADMIN), plantController.publish);
router.post('/:id/feature', authenticate(), requireRole(UserRole.ADMIN), plantController.feature);
router.delete('/:id', authenticate(), requireRole(UserRole.ADMIN), plantController.delete);
router.post(
  '/:id/images',
  authenticate(),
  requireRole(UserRole.BOTANIST),
  uploadMultiple,
  plantController.uploadImages,
);
router.post(
  '/:id/reviews',
  authenticate(),
  requireRole(UserRole.USER),
  validate(plantReviewSchema),
  plantController.createReview,
);

// ── 3D Garden / Model Upload Routes ───────────────────────────────────────
// TODO: move to 3d-garden module — these routes are kept here temporarily
// so that PUT /plants/:id/model, /model-lod, PATCH /:id/garden-position,
// DELETE /:id/model continue to work at their existing URLs.
router.put(
  '/:id/model',
  authenticate(),
  requireRole(UserRole.BOTANIST),
  uploadGLB.fields([{ name: 'model', maxCount: 1 }]),
  plantController.uploadModel,
);
router.put(
  '/:id/model-lod',
  authenticate(),
  requireRole(UserRole.BOTANIST),
  uploadGLB.fields([{ name: 'model_lod1', maxCount: 1 }, { name: 'model_lod2', maxCount: 1 }]),
  plantController.uploadModelLod,
);
router.patch(
  '/:id/garden-position',
  authenticate(),
  requireRole(UserRole.BOTANIST),
  plantController.updateGardenPosition,
);
router.delete(
  '/:id/model',
  authenticate(),
  requireRole(UserRole.BOTANIST),
  plantController.deleteModel,
);

export default router;
