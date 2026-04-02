import { Router } from 'express';
import { gardenController } from '../controllers/gardenController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { UserRole } from '../types';
import { addGardenPlantSchema, updateGardenPlantSchema } from '../validators/garden.validators';

const router = Router();

router.use(authenticate(), requireRole(UserRole.USER));

router.get('/', gardenController.getGarden);
router.post('/plants', validate(addGardenPlantSchema), gardenController.addPlant);
router.patch('/plants/:pid', validate(updateGardenPlantSchema), gardenController.updatePlant);
router.delete('/plants/:pid', gardenController.removePlant);

export default router;
