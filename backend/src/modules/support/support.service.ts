import SupportRequest, { ISupportRequest } from './SupportRequest.model';
import { notificationService } from '../notifications/notification.service';
import { NotificationType } from '../../types';
import { AppError } from '../../core/utils/apiResponse';
import mongoose from 'mongoose';

export class SupportService {
  async create(
    userId: string,
    data: { subject: string; message: string },
  ): Promise<ISupportRequest> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await SupportRequest.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: oneHourAgo },
    });

    if (recentCount >= 3) {
      throw new AppError(
        'Support requests are limited to 3 per hour. Please try again later.',
        429,
        'RATE_LIMIT_EXCEEDED',
      );
    }

    const request = await SupportRequest.create({
      userId: new mongoose.Types.ObjectId(userId),
      subject: data.subject,
      message: data.message,
      status: 'OPEN',
    });

    // Notify admins about the new support request
    await notificationService.notifyAdmins(
      NotificationType.ADMIN,
      'New Support Request',
      `New request received: "${data.subject}"`,
      '/admin/support',
    );

    return request;
  }

  async getMine(userId: string): Promise<unknown[]> {
    return SupportRequest.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
  }
}

export const supportService = new SupportService();
