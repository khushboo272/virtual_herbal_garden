import { Router } from 'express';
import authRoutes from './auth';
import plantRoutes from './plants';
import remedyRoutes from './remedies';
import gardenRoutes from './garden';
import aiRoutes from './ai';
import userRoutes from './users';
import adminRoutes from './admin';
import tourRoutes from './tours';

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
