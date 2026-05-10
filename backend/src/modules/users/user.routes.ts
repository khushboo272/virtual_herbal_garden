import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';
import { validate } from '../../core/middleware/validate';
import { uploadSingle } from '../../core/middleware/upload';
import { UserRole } from '../../types';
import { updateProfileSchema, createBookmarkSchema } from './user.validators';

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
router.patch('/me/notifications/mark-read', userController.markNotificationsRead);
router.get('/me/activity', userController.getActivity);
router.get('/me/stats', userController.getStats);
router.get('/me/dashboard-summary', userController.getDashboardSummary);
router.delete('/me', userController.deleteAccount);

export default router;
