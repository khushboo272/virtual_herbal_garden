import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import plantRoutes from '../modules/library/plant.routes';
import remedyRoutes from '../modules/remedies/remedy.routes';
import gardenRoutes from '../modules/garden/garden.routes';
import aiRoutes from '../modules/ai-scanner/detection.routes';
import userRoutes from '../modules/users/user.routes';
import adminRoutes from '../modules/admin/admin.routes';
import tourRoutes from '../modules/tours/tour.routes';
import homeRoutes from '../modules/home/home.routes';
import contributionRoutes from '../modules/contributions/contribution.routes';
import supportRoutes from '../modules/support/support.routes';
import roleApplicationRoutes from '../modules/admin/roleApplications.routes';
import systemRoutes from '../modules/system/system.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/plants', plantRoutes);
router.use('/remedies', remedyRoutes);
router.use('/users/me/garden', gardenRoutes);
router.use('/ai', aiRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/system', systemRoutes);
router.use('/tours', tourRoutes);
router.use('/home', homeRoutes);
router.use('/contributions', contributionRoutes);
router.use('/support', supportRoutes);
router.use('/role-applications', roleApplicationRoutes);


export default router;
