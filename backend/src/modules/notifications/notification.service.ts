import Notification from './Notification.model';
import { NotificationType, PaginationMeta } from '../../types';
import { getIO } from '../../core/socket';

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

  async markRead(userId: string, ids: string[] | 'all'): Promise<void> {
    if (ids === 'all') {
      await this.markAllRead(userId);
    } else if (Array.isArray(ids) && ids.length > 0) {
      await Notification.updateMany(
        { user: userId, _id: { $in: ids } },
        { $set: { isRead: true } },
      );
    }
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    actionUrl?: string,
    categoryOverride?: string,
  ): Promise<void> {
    const isSecurityNotice =
      /security|password|role|suspend|ban|reinstate|2fa|session|lockout|reauth/i.test(title + ' ' + body);

    if (!isSecurityNotice) {
      try {
        const User = (await import('../users/User.model')).default;
        const user = await User.findById(userId).select('preferences');
        const prefs = user?.preferences?.notifications;

        if (prefs) {
          let category = categoryOverride;
          if (!category) {
            const text = (title + ' ' + body).toLowerCase();
            if (text.includes('submission') || text.includes('draft') || text.includes('plant') || text.includes('remedy')) {
              category = 'newSubmission';
            } else if (text.includes('application') || text.includes('botanist')) {
              category = 'roleApplication';
            } else if (text.includes('support') || text.includes('ticket')) {
              category = 'support';
            } else if (text.includes('review') || text.includes('flag')) {
              category = 'flaggedReview';
            } else {
              category = 'system';
            }
          }

          if (category && (prefs as any)[category] === false) {
            // User opted out of this non-critical notification type
            return;
          }
        }
      } catch (err) {
        // Fallback to sending notification if checking preferences fails
      }
    }

    const notification = await Notification.create({
      user: userId,
      type,
      title,
      body,
      actionUrl: actionUrl || null,
    });

    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('notification:new', notification);
    } catch (e) {
      // Ignore if socket is not initialized
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ user: userId, isRead: false });
  }

  async notifyAdmins(
    type: NotificationType,
    title: string,
    body: string,
    actionUrl?: string,
  ): Promise<void> {
    const User = (await import('../users/User.model')).default;
    const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).select('_id');
    await Promise.all(
      admins.map((admin) =>
        this.createNotification(admin._id.toString(), type, title, body, actionUrl),
      ),
    );
  }
}

export const notificationService = new NotificationService();

