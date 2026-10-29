import { Router } from 'express';
import { systemController } from './system.controller';
import { authenticate } from '../../core/middleware/auth';
import { requireRole } from '../../core/middleware/rbac';
import { requireRecentAuth } from '../../core/middleware/requireRecentAuth';
import { validate } from '../../core/middleware/validate';
import { UserRole } from '../../types';
import {
  updateSystemUserRoleSchema,
  systemAuditLogsQuerySchema,
  updateSystemConfigurationSchema,
} from './system.validators';

const router = Router();

// Public System Status (No auth required so all users/guests can check maintenance state and active features)
router.get('/maintenance/status', systemController.getMaintenanceStatus);
router.get('/flags/public', systemController.getPublicFeatureFlags);
router.get('/feature-flags/public', systemController.getPublicFeatureFlags);

// Non-negotiable security rule: All system endpoints require SUPER_ADMIN role
router.use(authenticate(), requireRole(UserRole.SUPER_ADMIN));


// Role & Permission Matrix
router.get('/roles/matrix', systemController.getRolesMatrix);
router.get('/admins', systemController.getAdmins);
router.patch(
  '/users/:id/role',
  validate(updateSystemUserRoleSchema),
  systemController.updateUserRole,
);

// User Session Management
router.get('/users/:id/sessions', systemController.getUserSessions);
router.delete(
  '/users/:id/sessions/:sessionId',
  requireRecentAuth,
  systemController.revokeUserSession,
);

// Real Audit Log Management & Summary
router.get('/audit/summary', systemController.getAuditSummary);
router.get(
  '/audit-logs/export.csv',
  requireRecentAuth,
  systemController.exportAuditLogsCsv,
);
router.get(
  '/audit-logs',
  validate(systemAuditLogsQuerySchema, 'query'),
  systemController.getAuditLogs,
);
router.get('/audit-logs/:id', systemController.getAuditLogDetail);

// Security Events
router.get('/security/events', systemController.getSecurityEvents);

// System Overview & Realtime Diagnostics
router.get('/overview', systemController.getSystemOverview);
router.post('/operations/ping-subsystems', systemController.pingSubsystems);
router.post('/operations/clear-cache', systemController.clearSystemCache);
router.post('/operations/purge-expired-sessions', systemController.purgeExpiredSessions);

// Feature Flags Management
router.get('/feature-flags', systemController.getFeatureFlags);
router.post('/feature-flags', systemController.createFeatureFlag);
router.patch('/feature-flags/:key', systemController.updateFeatureFlag);
router.delete('/feature-flags/:key', systemController.deleteFeatureFlag);
router.post('/feature-flags/reset', systemController.resetFeatureFlags);

// System Configuration & AI Model Control
router.get('/config', systemController.getSystemConfig);
router.patch('/config', validate(updateSystemConfigurationSchema), systemController.updateSystemConfig);
router.post('/config/test-ai', systemController.testAIConnection);
router.post('/config/sync-env', systemController.syncEnvConfig);

export default router;

