import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';
import { validate } from '../../core/middleware/validate';
import { UserRole } from '../../types';
import {
  updateUserRoleSchema, banUserSchema, broadcastNotificationSchema,
  rejectPlantSchema, adminUserQuerySchema, auditLogQuerySchema,
  updateSystemConfigSchema,
} from './admin.validators';

const router = Router();

router.use(authenticate(), requireRole(UserRole.ADMIN));

router.get('/stats/overview', adminController.getOverviewStats);
router.get('/stats/analytics', adminController.getAnalytics);
router.get('/users', validate(adminUserQuerySchema, 'query'), adminController.listUsers);
router.patch('/users/:id/role', validate(updateUserRoleSchema), adminController.updateUserRole);
router.patch('/users/:id/ban', validate(banUserSchema), adminController.banUser);
router.get('/plants/drafts', adminController.getDraftPlants);
router.post('/plants/:id/approve', adminController.approvePlant);
router.post('/plants/:id/reject', validate(rejectPlantSchema), adminController.rejectPlant);
router.get('/reviews/flagged', adminController.getFlaggedReviews);
router.delete('/reviews/:id', adminController.deleteReview);
router.get('/audit-logs', validate(auditLogQuerySchema, 'query'), adminController.getAuditLogs);
router.post('/notifications/broadcast', validate(broadcastNotificationSchema), adminController.broadcastNotification);
router.get('/system/health', adminController.getSystemHealth);
router.patch('/system/config', requireRole(UserRole.SUPER_ADMIN), validate(updateSystemConfigSchema), adminController.updateSystemConfig);

export default router;
