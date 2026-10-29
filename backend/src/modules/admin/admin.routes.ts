import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';
import { validate } from '../../core/middleware/validate';
import { UserRole } from '../../types';
import {
  updateUserRoleSchema,
  banUserSchema,
  broadcastNotificationSchema,
  requestChangesSchema,
  auditLogQuerySchema,
  updateSystemConfigSchema,
} from './admin.validators';

const router = Router();

// Base middleware for all admin routes: must be authenticated and at least ADMIN role
router.use(authenticate(), requireRole(UserRole.ADMIN));

// --- Dashboard & Analytics ---
router.get('/dashboard-summary', adminController.getDashboardSummary);
router.get('/stats', adminController.getStats);
router.get('/stats/overview', adminController.getOverviewStats);
router.get('/stats/analytics', adminController.getAnalytics);
router.get('/search', adminController.search);

// --- User Management ---
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUserDetail);
// Role policy matrix is enforced inside adminUsersService (ADMIN may switch USER <-> BOTANIST, SUPER_ADMIN any)
router.patch('/users/:id/role', validate(updateUserRoleSchema), adminController.updateUserRole);
router.patch('/users/:id/ban', validate(banUserSchema), adminController.banUser);
router.post('/users/:id/force-logout', adminController.forceLogout);

// --- Moderation Queue ---
router.get('/moderation/summary', adminController.getModerationSummary);
router.get('/moderation', adminController.listModerationQueue);
router.get('/moderation/:type/:id', adminController.getModerationItemDetail);
router.post('/moderation/:type/:id/approve', adminController.approveModerationItem);
router.post('/moderation/:type/:id/reject', adminController.rejectModerationItem);
router.post('/moderation/:type/:id/request-changes', adminController.requestChangesModerationItem);

// Backward compatibility moderation endpoints
router.get('/plants/drafts', adminController.getDraftPlants);
router.post('/plants/:id/approve', adminController.approvePlant);
router.post('/plants/:id/reject', adminController.rejectPlant);
router.post('/plants/:id/request-changes', validate(requestChangesSchema), adminController.requestChangesPlant);
router.post('/remedies/:id/approve', adminController.approveRemedy);
router.post('/remedies/:id/reject', adminController.rejectRemedy);
router.post('/remedies/:id/request-changes', validate(requestChangesSchema), adminController.requestChangesRemedy);

// --- Content Management (All plants/remedies) ---
router.get('/content/:type', adminController.listContent);
router.post('/content/:type/:id/publish', adminController.publishContent);
router.post('/content/:type/:id/unpublish', adminController.unpublishContent);
router.post('/content/:type/:id/toggle-feature', adminController.toggleFeatureContent);
router.get('/content/:type/:id/impact', adminController.getImpactContent);
router.delete('/content/:type/:id', adminController.deleteContent);
router.post('/content/:type/bulk-unpublish', adminController.bulkUnpublishContent);
router.post('/content/:type/bulk-publish', adminController.bulkPublishContent);
router.post('/content/:type/bulk-feature', adminController.bulkFeatureContent);
router.post('/content/:type/bulk-status', adminController.bulkStatusContent);
router.post('/content/:type/bulk-delete', adminController.bulkDeleteContent);

// --- Role Applications (Admin review) ---
router.get('/role-applications', adminController.listRoleApplications);
router.post('/role-applications/:id/approve', adminController.approveRoleApplication);
router.post('/role-applications/:id/reject', adminController.rejectRoleApplication);

// --- Reviews & Existing Features ---
router.get('/reviews/flagged', adminController.getFlaggedReviews);
router.delete('/reviews/:id', adminController.deleteReview);
router.get('/audit-logs', validate(auditLogQuerySchema, 'query'), adminController.getAuditLogs);
router.post('/notifications/broadcast', validate(broadcastNotificationSchema), adminController.broadcastNotification);

// --- System Configuration (SUPER_ADMIN only for mutation) ---
router.get('/system/health', adminController.getSystemHealth);
router.get('/system/config/public', adminController.getPublicConfig);
router.patch(
  '/system/config',
  requireRole(UserRole.SUPER_ADMIN),
  validate(updateSystemConfigSchema),
  adminController.updateSystemConfig,
);

export default router;
