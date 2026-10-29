import { Request, Response } from 'express';
import { userService } from './user.service';
import { notificationService } from '../notifications/notification.service';
import { storageService } from '../../core/utils/storageService';
import { BookmarkEntityType, PaginationMeta } from '../../types';
import { sendSuccess, sendCreated, AppError } from '../../core/utils/apiResponse';

export class UserController {
  async getProfile(req: Request, res: Response) {
    const user = await userService.getProfile(req.user!.sub);
    sendSuccess(res, user);
  }

  async updateProfile(req: Request, res: Response) {
    const user = await userService.updateProfile(req.user!.sub, req.body);
    sendSuccess(res, user);
  }

  async uploadAvatar(req: Request, res: Response) {
    if (!req.file) throw new AppError('No file provided', 400, 'NO_FILE');
    const url = await storageService.uploadAvatar(req.file.buffer, req.user!.sub);
    const user = await userService.updateAvatar(req.user!.sub, url);
    sendSuccess(res, user);
  }

  async getBookmarks(req: Request, res: Response) {
    const type = (req.query.type || req.query.entityType) as BookmarkEntityType | string | undefined;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = await userService.getBookmarks(req.user!.sub, { type: type as string, page, limit });
    if (result && typeof result === 'object' && 'meta' in result) {
      sendSuccess(res, (result as { bookmarks: unknown[] }).bookmarks, 200, (result as { meta: PaginationMeta }).meta);
    } else {
      sendSuccess(res, result);
    }
  }

  async createBookmark(req: Request, res: Response) {
    const bookmark = await userService.createBookmark(req.user!.sub, req.body);
    sendCreated(res, bookmark);
  }

  async deleteBookmark(req: Request, res: Response) {
    await userService.deleteBookmark(req.user!.sub, req.params.id);
    sendSuccess(res, { message: 'Bookmark removed' });
  }

  async deleteBookmarkByEntity(req: Request, res: Response) {
    await userService.deleteBookmarkByEntity(req.user!.sub, req.params.type, req.params.entityId);
    sendSuccess(res, { message: 'Bookmark removed' });
  }

  async getNotifications(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;
    const result = await notificationService.getUserNotifications(req.user!.sub, page, limit, isRead);
    sendSuccess(res, result.notifications, 200, result.meta);
  }

  async markAllNotificationsRead(req: Request, res: Response) {
    await notificationService.markAllRead(req.user!.sub);
    sendSuccess(res, { message: 'All notifications marked as read' });
  }

  async markNotificationsRead(req: Request, res: Response) {
    const { ids } = req.body;
    if (!ids) throw new AppError('ids field is required', 400, 'MISSING_IDS');
    await notificationService.markRead(req.user!.sub, ids);
    sendSuccess(res, { message: 'Notifications marked as read' });
  }

  async getStats(req: Request, res: Response) {
    const stats = await userService.getStats(req.user!.sub);
    sendSuccess(res, stats);
  }

  async getDashboardSummary(req: Request, res: Response) {
    const summary = await userService.getDashboardSummary(req.user!.sub);
    sendSuccess(res, summary);
  }

  async getActivity(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await userService.getActivity(req.user!.sub, page, limit);
    sendSuccess(res, result.activities, 200, result.meta);
  }

  async deleteAccount(req: Request, res: Response) {
    await userService.deleteAccount(req.user!.sub, req.body);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    sendSuccess(res, { message: 'Account deleted successfully' });
  }

  async getSessions(req: Request, res: Response) {
    const { authService } = await import('../auth/auth.service');
    const refreshToken = req.cookies?.refreshToken;
    const sessions = await authService.getUserSessions(req.user!.sub, refreshToken);
    sendSuccess(res, sessions);
  }

  async deleteSession(req: Request, res: Response) {
    const { authService } = await import('../auth/auth.service');
    await authService.revokeSession(req.user!.sub, req.params.id, req);
    sendSuccess(res, { message: 'Session revoked' });
  }

  async revokeOtherSessions(req: Request, res: Response) {
    const { authService } = await import('../auth/auth.service');
    const refreshToken = req.cookies?.refreshToken;
    await authService.revokeOtherSessions(req.user!.sub, refreshToken, req);
    sendSuccess(res, { message: 'All other sessions revoked' });
  }

  async getPreferences(req: Request, res: Response) {
    const preferences = await userService.getPreferences(req.user!.sub);
    sendSuccess(res, preferences);
  }

  async updatePreferences(req: Request, res: Response) {
    const preferences = await userService.updatePreferences(req.user!.sub, req.body);
    sendSuccess(res, preferences);
  }

  async getLoginHistory(req: Request, res: Response) {
    const history = await userService.getMyLoginHistory(req.user!.sub);
    sendSuccess(res, history);
  }
}

export const userController = new UserController();
