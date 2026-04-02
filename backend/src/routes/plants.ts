import { Router } from 'express';
import { plantController } from '../controllers/plantController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { uploadMultiple } from '../middleware/upload';
import { UserRole } from '../types';
import { createPlantSchema, updatePlantSchema, plantQuerySchema, plantReviewSchema } from '../validators/plant.validators';

const router = Router();

// Public routes
router.get('/', validate(plantQuerySchema, 'query'), plantController.list);
router.get('/featured', plantController.featured);
router.get('/search/autocomplete', plantController.autocomplete);
router.get('/:slug', authenticate(true), plantController.getBySlug);
router.get('/:id/related', plantController.getRelated);
router.get('/:id/reviews', plantController.getReviews);

// Protected routes
router.post('/', authenticate(), requireRole(UserRole.BOTANIST), validate(createPlantSchema), plantController.create);
router.patch('/:id', authenticate(), requireRole(UserRole.BOTANIST), validate(updatePlantSchema), plantController.update);
router.post('/:id/publish', authenticate(), requireRole(UserRole.ADMIN), plantController.publish);
router.post('/:id/feature', authenticate(), requireRole(UserRole.ADMIN), plantController.feature);
router.delete('/:id', authenticate(), requireRole(UserRole.ADMIN), plantController.delete);
router.post('/:id/images', authenticate(), requireRole(UserRole.BOTANIST), uploadMultiple, plantController.uploadImages);
router.post('/:id/reviews', authenticate(), requireRole(UserRole.USER), validate(plantReviewSchema), plantController.createReview);

export default router;
