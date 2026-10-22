import { Router } from 'express';
import { homeController } from './home.controller';

const router = Router();

// GET /api/v1/home — public, no auth required
router.get('/', homeController);

export default router;
