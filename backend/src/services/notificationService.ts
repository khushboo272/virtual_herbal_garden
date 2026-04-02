import Notification from '../models/Notification';
import { NotificationType, PaginationMeta } from '../types';

export class NotificationService {
  async getUserNotifications(
    userId: string,
    page: number,
    limit: number,
    isRead?: boolean,
  ): Promise<{ notifications: unknown[]; meta: PaginationMeta }> {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = { user: userId };
    if (isRead !== undefined) query.isRead = isRead;

    const [notifications, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(query),
    ]);

    return {
      notifications,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async markAllRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } },
    );
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    actionUrl?: string,
  ): Promise<void> {
    await Notification.create({
      user: userId,
      type,
      title,
      body,
      actionUrl: actionUrl || null,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ user: userId, isRead: false });
  }
}

export const notificationService = new NotificationService();
