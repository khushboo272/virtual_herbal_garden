import { Router } from 'express';
import { remedyController } from './remedy.controller';
import { authenticate } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';
import { validate } from '../../core/middleware/validate';
import { UserRole } from '../../types';
import { createRemedySchema, updateRemedySchema, remedyQuerySchema } from './remedy.validators';

const router = Router();

router.get('/', validate(remedyQuerySchema, 'query'), remedyController.list);
router.get('/:slug', remedyController.getBySlug);
router.post('/', authenticate(), requireRole(UserRole.BOTANIST), validate(createRemedySchema), remedyController.create);
router.patch('/:id', authenticate(), requireRole(UserRole.BOTANIST), validate(updateRemedySchema), remedyController.update);
router.delete('/:id', authenticate(), requireRole(UserRole.ADMIN), remedyController.delete);
router.post('/:id/publish', authenticate(), requireRole(UserRole.ADMIN), remedyController.publish);

export default router;
