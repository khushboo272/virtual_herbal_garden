import { Request, Response } from 'express';
import { adminService } from '../services/adminService';
import { UserRole, NotificationType } from '../types';
import { sendSuccess } from '../utils/apiResponse';

export class AdminController {
  async getOverviewStats(_req: Request, res: Response) {
    const stats = await adminService.getOverviewStats();
    sendSuccess(res, stats);
  }

  async getAnalytics(req: Request, res: Response) {
    const { from, to } = req.query as { from?: string; to?: string };
    const analytics = await adminService.getAnalytics(from, to);
    sendSuccess(res, analytics);
  }

  async listUsers(req: Request, res: Response) {
    const result = await adminService.listUsers(req.query as unknown as Parameters<typeof adminService.listUsers>[0]);
    sendSuccess(res, result.users, 200, result.meta);
  }

  async updateUserRole(req: Request, res: Response) {
    const user = await adminService.updateUserRole(req.params.id, req.body.role as UserRole, req.user!.sub, req);
    sendSuccess(res, user);
  }

  async banUser(req: Request, res: Response) {
    const user = await adminService.banUser(req.params.id, req.body.isActive, req.body.banReason, req.user!.sub, req);
    sendSuccess(res, user);
  }

  async getDraftPlants(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await adminService.getDraftPlants(page, limit);
    sendSuccess(res, result.plants, 200, result.meta);
  }

  async approvePlant(req: Request, res: Response) {
    await adminService.approvePlant(req.params.id);
    sendSuccess(res, { message: 'Plant approved' });
  }

  async rejectPlant(req: Request, res: Response) {
    await adminService.rejectPlant(req.params.id, req.body.feedback);
    sendSuccess(res, { message: 'Plant rejected' });
  }

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

  async updateSystemConfig(req: Request, res: Response) {
    const config = await adminService.updateSystemConfig(req.body);
    sendSuccess(res, config);
  }
}

export const adminController = new AdminController();
