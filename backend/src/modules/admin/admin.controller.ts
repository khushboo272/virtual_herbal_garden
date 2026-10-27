import { Request, Response } from 'express';
import { adminService } from './admin.service';
import { adminUsersService } from './adminUsers.service';
import { moderationService } from './moderation.service';
import { adminContentService } from './adminContent.service';
import { roleApplicationsService } from './roleApplications.service';
import { UserRole, NotificationType } from '../../types';
import { sendSuccess } from '../../core/utils/apiResponse';

export class AdminController {
  // --- Dashboard & Analytics ---
  async getDashboardSummary(_req: Request, res: Response) {
    const summary = await adminService.getDashboardSummary();
    sendSuccess(res, summary);
  }

  async getStats(_req: Request, res: Response) {
    const stats = await adminService.getStats();
    sendSuccess(res, stats);
  }

  async getOverviewStats(_req: Request, res: Response) {
    const stats = await adminService.getOverviewStats();
    sendSuccess(res, stats);
  }

  async getAnalytics(req: Request, res: Response) {
    const { from, to } = req.query as { from?: string; to?: string };
    const analytics = await adminService.getAnalytics(from, to);
    sendSuccess(res, analytics);
  }

  // --- Users Management ---
  async listUsers(req: Request, res: Response) {
    const result = await adminUsersService.listUsers(req.query as any);
    sendSuccess(res, result, 200, result.pagination);
  }

  async getUserDetail(req: Request, res: Response) {
    const result = await adminUsersService.getUserDetail(req.params.id);
    sendSuccess(res, result);
  }

  async updateUserRole(req: Request, res: Response) {
    const user = await adminUsersService.updateUserRole(
      req.params.id,
      req.body.role as UserRole,
      req.user,
      req,
    );
    sendSuccess(res, user);
  }

  async banUser(req: Request, res: Response) {
    const { isActive, banReason, bannedUntil } = req.body;
    const user = await adminUsersService.banUser(
      req.params.id,
      isActive,
      banReason,
      bannedUntil ? new Date(bannedUntil) : undefined,
      req.user,
      req,
    );
    sendSuccess(res, user);
  }

  async forceLogout(req: Request, res: Response) {
    const result = await adminUsersService.forceLogout(req.params.id, req.user, req);
    sendSuccess(res, result);
  }

  // --- Moderation Queue ---
  async getModerationSummary(_req: Request, res: Response) {
    const summary = await moderationService.getSummary();
    sendSuccess(res, summary);
  }

  async listModerationQueue(req: Request, res: Response) {
    const { type = 'plant', ...filters } = req.query as any;
    const result = await moderationService.listQueue(type, filters);
    sendSuccess(res, result.items, 200, result.pagination);
  }

  async getModerationItemDetail(req: Request, res: Response) {
    const { type, id } = req.params;
    const result = await moderationService.getItemDetail(type as any, id);
    sendSuccess(res, result);
  }

  async approveModerationItem(req: Request, res: Response) {
    const { type, id } = req.params;
    const { feature } = req.body || {};
    const result = await moderationService.approve(type as any, id, req.user, { feature }, req);
    sendSuccess(res, result);
  }

  async rejectModerationItem(req: Request, res: Response) {
    const { type, id } = req.params;
    const { reason } = req.body || {};
    const result = await moderationService.reject(type as any, id, req.user, reason, req);
    sendSuccess(res, result);
  }

  async requestChangesModerationItem(req: Request, res: Response) {
    const { type, id } = req.params;
    const { comment } = req.body || {};
    const result = await moderationService.requestChanges(type as any, id, req.user, comment, req);
    sendSuccess(res, result);
  }

  // Backward compatibility routes for existing plants/remedies moderation endpoints
  async getDraftPlants(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await adminService.getDraftPlants(page, limit);
    sendSuccess(res, result.plants, 200, result.meta);
  }

  async approvePlant(req: Request, res: Response) {
    await moderationService.approve('plant', req.params.id, req.user, { feature: req.body?.feature }, req);
    sendSuccess(res, { message: 'Plant approved' });
  }

  async rejectPlant(req: Request, res: Response) {
    await moderationService.reject('plant', req.params.id, req.user, req.body?.reason || req.body?.feedback || 'Rejected', req);
    sendSuccess(res, { message: 'Plant rejected' });
  }

  async requestChangesPlant(req: Request, res: Response) {
    await moderationService.requestChanges('plant', req.params.id, req.user, req.body.comment, req);
    sendSuccess(res, { message: 'Changes requested for plant' });
  }

  async approveRemedy(req: Request, res: Response) {
    await moderationService.approve('remedy', req.params.id, req.user, { feature: req.body?.feature }, req);
    sendSuccess(res, { message: 'Remedy approved' });
  }

  async rejectRemedy(req: Request, res: Response) {
    await moderationService.reject('remedy', req.params.id, req.user, req.body?.reason || req.body?.feedback || 'Rejected', req);
    sendSuccess(res, { message: 'Remedy rejected' });
  }

  async requestChangesRemedy(req: Request, res: Response) {
    await moderationService.requestChanges('remedy', req.params.id, req.user, req.body.comment, req);
    sendSuccess(res, { message: 'Changes requested for remedy' });
  }

  // --- Content Management ---
  async listContent(req: Request, res: Response) {
    const { type } = req.params;
    const result = await adminContentService.listContent(type as any, req.query as any);
    sendSuccess(res, result.items, 200, result.pagination);
  }

  async publishContent(req: Request, res: Response) {
    const { type, id } = req.params;
    const result = await adminContentService.publish(type as any, id, req.user, req);
    sendSuccess(res, result);
  }

  async unpublishContent(req: Request, res: Response) {
    const { type, id } = req.params;
    const result = await adminContentService.unpublish(type as any, id, req.user, req);
    sendSuccess(res, result);
  }

  async toggleFeatureContent(req: Request, res: Response) {
    const { type, id } = req.params;
    const result = await adminContentService.toggleFeature(type as any, id, req.user, req);
    sendSuccess(res, result);
  }

  async getImpactContent(req: Request, res: Response) {
    const { type, id } = req.params;
    const result = await adminContentService.getImpact(type as any, id);
    sendSuccess(res, result);
  }

  async deleteContent(req: Request, res: Response) {
    const { type, id } = req.params;
    const { confirmSlug } = req.body || {};
    const result = await adminContentService.deleteContent(type as any, id, confirmSlug, req.user, req);
    sendSuccess(res, result);
  }

  async bulkUnpublishContent(req: Request, res: Response) {
    const { type } = req.params;
    const { ids } = req.body || {};
    const result = await adminContentService.bulkUnpublish(type as any, ids, req.user, req);
    sendSuccess(res, result);
  }

  async bulkDeleteContent(req: Request, res: Response) {
    const { type } = req.params;
    const { ids } = req.body || {};
    const result = await adminContentService.bulkDelete(type as any, ids, req.user, req);
    sendSuccess(res, result);
  }

  // --- Role Applications (Admin) ---
  async listRoleApplications(req: Request, res: Response) {
    const { status, page, limit } = req.query as any;
    const result = await roleApplicationsService.listApplications(status, page, limit);
    sendSuccess(res, result.items, 200, result.pagination);
  }

  async approveRoleApplication(req: Request, res: Response) {
    const { id } = req.params;
    const { note } = req.body || {};
    const result = await roleApplicationsService.approveApplication(id, req.user, note, req);
    sendSuccess(res, result);
  }

  async rejectRoleApplication(req: Request, res: Response) {
    const { id } = req.params;
    const { reason } = req.body || {};
    const result = await roleApplicationsService.rejectApplication(id, req.user, reason, req);
    sendSuccess(res, result);
  }

  // --- User-facing Role Applications ---
  async submitRoleApplication(req: Request, res: Response) {
    const result = await roleApplicationsService.submitApplication(req.user!.sub, req.body, req);
    sendSuccess(res, result, 201);
  }

  async getMyRoleApplication(req: Request, res: Response) {
    const result = await roleApplicationsService.getMyApplication(req.user!.sub);
    sendSuccess(res, result);
  }

  // --- Reviews & System Config ---
  async getFlaggedReviews(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await adminService.getFlaggedReviews(page, limit);
    sendSuccess(res, result.reviews, 200, result.meta);
  }

  async deleteReview(req: Request, res: Response) {
    await adminService.deleteReview(req.params.id);
    sendSuccess(res, { message: 'Review deleted' });
  }

  async getAuditLogs(req: Request, res: Response) {
    const result = await adminService.getAuditLogs(req.query as unknown as Parameters<typeof adminService.getAuditLogs>[0]);
    sendSuccess(res, result.logs, 200, result.meta);
  }

  async broadcastNotification(req: Request, res: Response) {
    const count = await adminService.broadcastNotification({
      ...req.body,
      type: req.body.type as NotificationType,
      targetRoles: req.body.targetRoles as UserRole[],
    });
    sendSuccess(res, { message: `Notification sent to ${count} users` });
  }

  async getSystemHealth(_req: Request, res: Response) {
    const health = await adminService.getSystemHealth();
    sendSuccess(res, health);
  }

  async getPublicConfig(_req: Request, res: Response) {
    const config = await adminService.getPublicConfig();
    sendSuccess(res, config);
  }

  async updateSystemConfig(req: Request, res: Response) {
    const config = await adminService.updateSystemConfig(req.body);
    sendSuccess(res, config);
  }
}

export const adminController = new AdminController();
