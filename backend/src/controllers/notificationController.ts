import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import { sendSuccess } from '../utils/apiResponse';

export class NotificationController {
  async list(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;
    const result = await notificationService.getUserNotifications(req.user!.sub, page, limit, isRead);
    sendSuccess(res, result.notifications, 200, result.meta);
  }

  async markAllRead(req: Request, res: Response) {
    await notificationService.markAllRead(req.user!.sub);
    sendSuccess(res, { message: 'All notifications marked as read' });
  }
}

export const notificationController = new NotificationController();
