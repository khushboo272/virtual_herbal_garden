import { Request, Response } from 'express';
import { systemService } from './system.service';
import { sendSuccess } from '../../core/utils/apiResponse';

export class SystemController {
  async getRolesMatrix(_req: Request, res: Response) {
    const result = await systemService.getRolesMatrix();
    sendSuccess(res, result);
  }

  async getAdmins(_req: Request, res: Response) {
    const admins = await systemService.getAdmins();
    sendSuccess(res, admins);
  }

  async updateUserRole(req: Request, res: Response) {
    const user = await systemService.updateUserRole(
      req.params.id,
      req.body.role,
      req.user as any,
      req,
    );
    sendSuccess(res, user);
  }

  async getUserSessions(req: Request, res: Response) {
    const sessions = await systemService.getUserSessions(req.params.id);
    sendSuccess(res, sessions);
  }

  async revokeUserSession(req: Request, res: Response) {
    await systemService.revokeUserSession(req.params.id, req.params.sessionId, req);
    sendSuccess(res, { message: 'Session revoked successfully' });
  }

  async getAuditLogs(req: Request, res: Response) {
    const result = await systemService.getAuditLogs(req.query as any);
    sendSuccess(res, result.logs, 200, result.meta);
  }

  async getAuditLogDetail(req: Request, res: Response) {
    const log = await systemService.getAuditLogDetail(req.params.id);
    sendSuccess(res, log);
  }

  async getAuditSummary(_req: Request, res: Response) {
    const summary = await systemService.getAuditSummary();
    sendSuccess(res, summary);
  }

  async exportAuditLogsCsv(req: Request, res: Response) {
    await systemService.exportAuditLogsCsv(req.query, res, req);
  }

  async getSecurityEvents(_req: Request, res: Response) {
    const events = await systemService.getSecurityEvents();
    sendSuccess(res, events);
  }

  async getSystemOverview(_req: Request, res: Response) {
    const overview = await systemService.getSystemOverview();
    sendSuccess(res, overview);
  }

  async pingSubsystems(_req: Request, res: Response) {
    const pings = await systemService.pingSubsystems();
    sendSuccess(res, pings);
  }

  async clearSystemCache(req: Request, res: Response) {
    const userId = (req.user as any)?.id || (req.user as any)?._id;
    const result = await systemService.clearSystemCache(userId, req);
    sendSuccess(res, result);
  }

  async purgeExpiredSessions(req: Request, res: Response) {
    const userId = (req.user as any)?.id || (req.user as any)?._id;
    const result = await systemService.purgeExpiredSessions(userId, req);
    sendSuccess(res, result);
  }

  async getPublicFeatureFlags(_req: Request, res: Response) {
    const result = await systemService.getPublicFeatureFlags();
    sendSuccess(res, result);
  }

  async getFeatureFlags(_req: Request, res: Response) {
    const result = await systemService.getFeatureFlags();
    sendSuccess(res, result);
  }

  async updateFeatureFlag(req: Request, res: Response) {
    const result = await systemService.updateFeatureFlag(
      req.params.key,
      req.body,
      req.user as any,
      req
    );
    sendSuccess(res, result);
  }

  async createFeatureFlag(req: Request, res: Response) {
    const result = await systemService.createFeatureFlag(
      req.body,
      req.user as any,
      req
    );
    sendSuccess(res, result, 201);
  }

  async deleteFeatureFlag(req: Request, res: Response) {
    const result = await systemService.deleteFeatureFlag(
      req.params.key,
      req.user as any,
      req
    );
    sendSuccess(res, result);
  }

  async resetFeatureFlags(req: Request, res: Response) {
    const result = await systemService.resetFeatureFlags(req.user as any, req);
    sendSuccess(res, result);
  }

  async getMaintenanceStatus(_req: Request, res: Response) {
    const result = await systemService.getMaintenanceStatus();
    sendSuccess(res, result);
  }

  async getSystemConfig(_req: Request, res: Response) {
    const result = await systemService.getSystemConfig();
    sendSuccess(res, result);
  }

  async updateSystemConfig(req: Request, res: Response) {
    const result = await systemService.updateSystemConfig(
      req.body,
      req.user as any,
      req
    );
    sendSuccess(res, result);
  }

  async testAIConnection(req: Request, res: Response) {
    const result = await systemService.testAIConnection(req.body);
    sendSuccess(res, result);
  }

  async syncEnvConfig(req: Request, res: Response) {
    const result = await systemService.syncWithEnvDefaults(req.user as any, req);
    sendSuccess(res, result);
  }
}

export const systemController = new SystemController();


