import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { uploadSingle } from '../middleware/upload';
import { UserRole } from '../types';
import { updateProfileSchema, createBookmarkSchema } from '../validators/user.validators';

const router = Router();

router.use(authenticate(), requireRole(UserRole.USER));

router.get('/me', userController.getProfile);
router.patch('/me', validate(updateProfileSchema), userController.updateProfile);
router.post('/me/avatar', uploadSingle, userController.uploadAvatar);
router.get('/me/bookmarks', userController.getBookmarks);
router.post('/me/bookmarks', validate(createBookmarkSchema), userController.createBookmark);
router.delete('/me/bookmarks/:id', userController.deleteBookmark);
router.get('/me/notifications', userController.getNotifications);
router.patch('/me/notifications/read-all', userController.markAllNotificationsRead);
router.get('/me/activity', userController.getActivity);
router.delete('/me', userController.deleteAccount);

export default router;
