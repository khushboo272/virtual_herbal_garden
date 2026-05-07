import { Router } from 'express';
import { gardenController } from './garden.controller';
import { authenticate } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';
import { validate } from '../../core/middleware/validate';
import { UserRole } from '../../types';
import { addGardenPlantSchema, updateGardenPlantSchema } from './garden.validators';

const router = Router();

router.use(authenticate(), requireRole(UserRole.USER));

router.get('/', gardenController.getGarden);
router.post('/plants', validate(addGardenPlantSchema), gardenController.addPlant);
router.patch('/plants/:pid', validate(updateGardenPlantSchema), gardenController.updatePlant);
router.delete('/plants/:pid', gardenController.removePlant);

export default router;
