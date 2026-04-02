import { Router } from 'express';
import { tourController } from '../controllers/tourController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { UserRole } from '../types';
import { createTourSchema, updateTourSchema, tourQuerySchema } from '../validators/tour.validators';

const router = Router();

router.get('/', validate(tourQuerySchema, 'query'), tourController.list);
router.get('/:slug', tourController.getBySlug);
router.post('/', authenticate(), requireRole(UserRole.ADMIN), validate(createTourSchema), tourController.create);
router.patch('/:id', authenticate(), requireRole(UserRole.ADMIN), validate(updateTourSchema), tourController.update);
router.delete('/:id', authenticate(), requireRole(UserRole.ADMIN), tourController.delete);
router.post('/:id/publish', authenticate(), requireRole(UserRole.ADMIN), tourController.publish);

export default router;
