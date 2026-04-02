import User from '../models/User';
import Plant from '../models/Plant';
import Remedy from '../models/Remedy';
import Detection from '../models/Detection';
import Review from '../models/Review';
import AuditLog from '../models/AuditLog';
import Notification from '../models/Notification';
import SystemConfig from '../models/SystemConfig';
import { UserRole, AuditAction, NotificationType, PaginationMeta } from '../types';
import { AppError } from '../utils/apiResponse';
import { redis } from '../config/redis';

export class AdminService {
  async getOverviewStats(): Promise<Record<string, unknown>> {
    const cached = await redis.get('admin:stats:overview');
    if (cached) return JSON.parse(cached);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalPlants,
      totalRemedies,
      detectionsThisMonth,
      newSignupsData,
    ] = await Promise.all([
      User.countDocuments(),
      Plant.countDocuments({ isDeleted: false }),
      Remedy.countDocuments({ isDeleted: false }),
      Detection.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const stats = {
      totalUsers,
      totalPlants,
      totalRemedies,
      detectionsThisMonth,
      signupChart: newSignupsData,
    };

    await redis.setex('admin:stats:overview', 300, JSON.stringify(stats));
    return stats;
  }

  async getAnalytics(
    from?: string,
    to?: string,
  ): Promise<Record<string, unknown>> {
    const match: Record<string, unknown> = {};
    if (from || to) {
      match.createdAt = {};
      if (from) (match.createdAt as Record<string, unknown>).$gte = new Date(from);
      if (to) (match.createdAt as Record<string, unknown>).$lte = new Date(to);
    }

    const [viewsData, registrationData, aiUsageData] = await Promise.all([
      Plant.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            totalViews: { $sum: '$viewCount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Detection.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return { views: viewsData, registrations: registrationData, aiUsage: aiUsageData };
  }

  async listUsers(
    filters: {
      page: number;
      limit: number;
      role?: string;
      isActive?: boolean;
      search?: string;
    },
  ): Promise<{ users: unknown[]; meta: PaginationMeta }> {
    const { page, limit, role, isActive, search } = filters;
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash -totpSecret -oauthAccounts')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return {
      users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateUserRole(
    userId: string,
    newRole: UserRole,
    adminId: string,
    req: import('express').Request,
  ): Promise<unknown> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const oldRole = user.role;
    user.role = newRole;
    await user.save();

    await AuditLog.create({
      user: adminId,
      action: AuditAction.ROLE_CHANGE,
      entityType: 'User',
      entityId: userId,
      oldValue: { role: oldRole },
      newValue: { role: newRole },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return user;
  }

  async banUser(
    userId: string,
    isActive: boolean,
    banReason: string | undefined,
    adminId: string,
    req: import('express').Request,
  ): Promise<unknown> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    user.isActive = isActive;
    user.banReason = isActive ? null : (banReason || null);
    await user.save();

    await AuditLog.create({
      user: adminId,
      action: AuditAction.UPDATE,
      entityType: 'User',
      entityId: userId,
      oldValue: { isActive: !isActive },
      newValue: { isActive, banReason: user.banReason },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return user;
  }

  async getDraftPlants(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [plants, total] = await Promise.all([
      Plant.find({ isPublished: false, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'displayName')
        .lean(),
      Plant.countDocuments({ isPublished: false, isDeleted: false }),
    ]);
    return { plants, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async approvePlant(plantId: string): Promise<void> {
    const plant = await Plant.findByIdAndUpdate(plantId, { isPublished: true }, { new: true });
    if (!plant) throw new AppError('Plant not found', 404, 'NOT_FOUND');

    await Notification.create({
      user: plant.createdBy,
      type: NotificationType.ADMIN,
      title: 'Plant Approved',
      body: `Your plant "${plant.commonName}" has been approved and published.`,
      actionUrl: `/plants/${plant.slug}`,
    });
  }

  async rejectPlant(plantId: string, feedback: string): Promise<void> {
    const plant = await Plant.findById(plantId);
    if (!plant) throw new AppError('Plant not found', 404, 'NOT_FOUND');

    await Notification.create({
      user: plant.createdBy,
      type: NotificationType.ADMIN,
      title: 'Plant Submission Rejected',
      body: `Your plant "${plant.commonName}" was not approved. Feedback: ${feedback}`,
      actionUrl: `/plants/${plant.slug}`,
    });
  }

  async getFlaggedReviews(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find({ isFlagged: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'displayName email')
        .populate('plant', 'commonName slug')
        .lean(),
      Review.countDocuments({ isFlagged: true }),
    ]);
    return { reviews, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async deleteReview(reviewId: string): Promise<void> {
    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) throw new AppError('Review not found', 404, 'NOT_FOUND');
    // avgRating recalculated via post-findOneAndDelete hook
  }

  async getAuditLogs(filters: {
    page: number;
    limit: number;
    action?: string;
    user?: string;
    from?: string;
    to?: string;
  }) {
    const { page, limit, action, user: userId, from, to } = filters;
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    if (action) query.action = action;
    if (userId) query.user = userId;
    if (from || to) {
      query.createdAt = {};
      if (from) (query.createdAt as Record<string, unknown>).$gte = new Date(from);
      if (to) (query.createdAt as Record<string, unknown>).$lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'displayName email')
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return { logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async broadcastNotification(data: {
    title: string;
    body: string;
    type: NotificationType;
    actionUrl?: string;
    targetRoles?: UserRole[];
  }): Promise<number> {
    const query: Record<string, unknown> = { isActive: true };
    if (data.targetRoles?.length) {
      query.role = { $in: data.targetRoles };
    }

    const users = await User.find(query).select('_id').lean();
    const notifications = users.map((u) => ({
      user: u._id,
      type: data.type,
      title: data.title,
      body: data.body,
      actionUrl: data.actionUrl || null,
    }));

    await Notification.insertMany(notifications);
    return notifications.length;
  }

  async getSystemHealth(): Promise<Record<string, unknown>> {
    const checks: Record<string, string> = {};

    try {
      await import('mongoose').then((m) => m.default.connection.db?.admin().ping());
      checks.mongodb = 'ok';
    } catch {
      checks.mongodb = 'error';
    }

    try {
      await redis.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
    }

    checks.s3 = 'ok'; // Would add actual S3 check in production

    return checks;
  }

  async updateSystemConfig(data: Partial<{
    aiModelVersion: string;
    featuredPlantIds: string[];
    maintenanceMode: boolean;
    allowedDetectionsPerHour: number;
    featureFlags: Record<string, boolean>;
  }>): Promise<unknown> {
    const config = await SystemConfig.findByIdAndUpdate(
      'global',
      { $set: data },
      { new: true, upsert: true },
    );

    // Bust Redis cache
    await redis.del('system:config');
    await redis.del('admin:stats:overview');

    return config;
  }
}

export const adminService = new AdminService();
