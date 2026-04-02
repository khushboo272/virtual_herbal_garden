import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { notificationService } from '../services/notificationService';
import { storageService } from '../services/storageService';
import { BookmarkEntityType } from '../types';
import { sendSuccess, sendCreated, AppError } from '../utils/apiResponse';

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
    const entityType = req.query.entityType as BookmarkEntityType | undefined;
    const bookmarks = await userService.getBookmarks(req.user!.sub, entityType);
    sendSuccess(res, bookmarks);
  }

  async createBookmark(req: Request, res: Response) {
    const bookmark = await userService.createBookmark(req.user!.sub, req.body);
    sendCreated(res, bookmark);
  }

  async deleteBookmark(req: Request, res: Response) {
    await userService.deleteBookmark(req.user!.sub, req.params.id);
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

  async getActivity(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await userService.getActivity(req.user!.sub, page, limit);
    sendSuccess(res, result.activities, 200, result.meta);
  }

  async deleteAccount(req: Request, res: Response) {
    await userService.deleteAccount(req.user!.sub);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    sendSuccess(res, { message: 'Account deleted successfully' });
  }
}

export const userController = new UserController();
