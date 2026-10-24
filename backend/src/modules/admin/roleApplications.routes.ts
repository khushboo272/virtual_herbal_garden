import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate } from '../../core/middleware/auth';

const router = Router();

router.use(authenticate());

router.post('/', adminController.submitRoleApplication);
router.get('/mine', adminController.getMyRoleApplication);

export default router;
