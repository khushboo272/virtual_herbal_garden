import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import plantRoutes from '../modules/plants/plant.routes';
import remedyRoutes from '../modules/remedies/remedy.routes';
import gardenRoutes from '../modules/garden/garden.routes';
import aiRoutes from '../modules/ai-detection/detection.routes';
import userRoutes from '../modules/users/user.routes';
import adminRoutes from '../modules/admin/admin.routes';
import tourRoutes from '../modules/tours/tour.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/plants', plantRoutes);
router.use('/remedies', remedyRoutes);
router.use('/users/me/garden', gardenRoutes);
router.use('/ai', aiRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/tours', tourRoutes);

export default router;
