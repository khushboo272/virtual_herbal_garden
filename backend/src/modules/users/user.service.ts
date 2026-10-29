import User, { IUser } from './User.model';
import Bookmark from './Bookmark.model';
import Garden from '../garden/Garden.model';
import Detection from '../ai-scanner/Detection.model';
import Review from '../library/Review.model';
import ActivityLog from '../notifications/ActivityLog.model';
import { BookmarkEntityType, ActivityType, PaginationMeta } from '../../types';
import { AppError } from '../../core/utils/apiResponse';

import mongoose from 'mongoose';
import Plant from '../library/Plant.model';
import Remedy from '../remedies/Remedy.model';
import Tour from '../tours/Tour.model';
import { comparePassword } from '../../core/utils/hash';

export class UserService {
  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId).select('-passwordHash -totpSecret');
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return user;
  }

  async updateProfile(
    userId: string,
    data: { displayName?: string; name?: string; bio?: string },
  ): Promise<IUser> {
    const updateData: Record<string, unknown> = {};
    const name = data.displayName || data.name;
    if (name) updateData.displayName = name;
    if (data.bio !== undefined) updateData.bio = data.bio;

    const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true })
      .select('-passwordHash -totpSecret');
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return user;
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(userId, { avatarUrl }, { new: true })
      .select('-passwordHash -totpSecret');
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return user;
  }

  async getBookmarks(
    userId: string,
    options?: {
      type?: string;
      entityType?: BookmarkEntityType;
      page?: number;
      limit?: number;
    },
  ): Promise<{ bookmarks: unknown[]; meta: PaginationMeta } | unknown[]> {
    const query: Record<string, unknown> = { user: userId };

    const typeFilter = options?.type || options?.entityType;
    if (typeFilter && typeFilter !== 'ALL' && typeFilter !== 'all') {
      const normalized = typeFilter.toUpperCase();
      query.entityType = normalized;
    }

    const page = options?.page;
    const limit = options?.limit;
    const isPaginated = page !== undefined && limit !== undefined;

    let bookmarkQuery = Bookmark.find(query).sort({ createdAt: -1 });
    let total = 0;

    if (isPaginated) {
      const skip = (page - 1) * limit;
      total = await Bookmark.countDocuments(query);
      bookmarkQuery = bookmarkQuery.skip(skip).limit(limit);
    }

    const bookmarks = await bookmarkQuery.lean();

    // Populate items in parallel
    const populated = await Promise.all(
      bookmarks.map(async (bm) => {
        let item: {
          id: string;
          title: string;
          subtitle?: string;
          slug: string;
          image: string;
          type: 'plant' | 'remedy' | 'tour' | 'article';
        } | null = null;

        const entityIdStr = bm.entityId?.toString();

        if (bm.entityType === BookmarkEntityType.PLANT) {
          const plant = await Plant.findById(bm.entityId)
            .select('commonName scientificName slug images isPublished isDeleted')
            .lean();
          if (plant && !plant.isDeleted) {
            item = {
              id: plant._id.toString(),
              title: plant.commonName,
              subtitle: plant.scientificName,
              slug: plant.slug,
              image: plant.images?.[0]?.url || '',
              type: 'plant',
            };
          }
        } else if (bm.entityType === BookmarkEntityType.REMEDY) {
          const remedy = await Remedy.findById(bm.entityId)
            .select('title description slug image images isPublished isDeleted')
            .lean();
          if (remedy && !remedy.isDeleted) {
            item = {
              id: remedy._id.toString(),
              title: remedy.title,
              subtitle: remedy.description,
              slug: remedy.slug,
              image: remedy.image || remedy.images?.[0]?.url || '',
              type: 'remedy',
            };
          }
        } else if (bm.entityType === BookmarkEntityType.TOUR) {
          const tour = await Tour.findById(bm.entityId)
            .select('title summary description slug coverImage coverImageUrl isPublished isDeleted')
            .lean();
          if (tour && !tour.isDeleted) {
            item = {
              id: tour._id.toString(),
              title: tour.title,
              subtitle: tour.summary || tour.description,
              slug: tour.slug,
              image: tour.coverImage || tour.coverImageUrl || '',
              type: 'tour',
            };
          }
        } else if (bm.entityType === BookmarkEntityType.ARTICLE) {
          item = {
            id: entityIdStr,
            title: 'Article',
            slug: '',
            image: '',
            type: 'article',
          };
        }

        return {
          ...bm,
          item,
        };
      }),
    );

    if (isPaginated) {
      return {
        bookmarks: populated,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        } as PaginationMeta,
      };
    }

    return populated;
  }

  async createBookmark(userId: string, data: {
    entityType: BookmarkEntityType; entityId: string;
    collectionName?: string; notes?: string;
  }) {
    const bookmark = await Bookmark.create({ user: userId, ...data });
    await ActivityLog.create({
      user: userId, activityType: ActivityType.BOOKMARK,
      entityId: data.entityId, metadata: { entityType: data.entityType },
    });
    return bookmark;
  }

  async deleteBookmark(userId: string, idOrEntityId: string): Promise<void> {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrEntityId);
    if (!isObjectId) {
      throw new AppError('Invalid identifier', 400, 'INVALID_ID');
    }

    const objId = new mongoose.Types.ObjectId(idOrEntityId);
    const r = await Bookmark.findOneAndDelete({
      user: userId,
      $or: [{ _id: objId }, { entityId: objId }],
    });

    if (!r) throw new AppError('Bookmark not found', 404, 'NOT_FOUND');
  }

  async deleteBookmarkByEntity(userId: string, entityType: string, entityId: string): Promise<void> {
    const isObjectId = mongoose.Types.ObjectId.isValid(entityId);
    if (!isObjectId) {
      throw new AppError('Invalid entity identifier', 400, 'INVALID_ID');
    }

    const r = await Bookmark.findOneAndDelete({
      user: userId,
      entityType: entityType.toUpperCase(),
      entityId: new mongoose.Types.ObjectId(entityId),
    });

    if (!r) throw new AppError('Bookmark not found', 404, 'NOT_FOUND');
  }

  async getStats(userId: string): Promise<{
    plantsExplored: number;
    toursCompleted: number;
    learningHours: number;
    detections: number;
  }> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const [plantsExplored, detections] = await Promise.all([
      Bookmark.countDocuments({ user: userId, entityType: 'PLANT' }),
      Detection.countDocuments({ user: userId }),
    ]);

    // toursCompleted and learningHours: no tracking model yet — return 0
    return {
      plantsExplored,
      toursCompleted: 0,
      learningHours: 0,
      detections,
    };
  }

  async getActivity(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [activities, total] = await Promise.all([
      ActivityLog.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments({ user: userId }),
    ]);
    return { activities, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } as PaginationMeta };
  }

  /**
   * Aggregated dashboard summary per PRD §4.2.2 / §7.1
   * Single endpoint to power all 4 USER stat cards + recent activity + bookmarks.
   */
  async getDashboardSummary(userId: string) {
    const [bookmarksCount, gardenDoc, scansCount, recentActivity, recentBookmarks] =
      await Promise.all([
        Bookmark.countDocuments({ user: userId }),
        Garden.findOne({ user: userId }).select('plants').lean(),
        Detection.countDocuments({ user: userId }),
        ActivityLog.find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
        Bookmark.find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('entityId')
          .lean(),
      ]);

    return {
      stats: {
        bookmarks: bookmarksCount,
        gardenPlants: gardenDoc?.plants?.length ?? 0,
        aiScans: scansCount,
        streak: 0, // TODO: implement streak tracking in User model
      },
      recentActivity,
      recentBookmarks,
    };
  }

  async deleteAccount(
    userId: string,
    confirmation?: { password?: string; confirmation?: string },
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    if (user.passwordHash) {
      if (!confirmation?.password && confirmation?.confirmation !== 'DELETE') {
        throw new AppError(
          'Password or typed confirmation "DELETE" is required to delete your account',
          400,
          'CONFIRMATION_REQUIRED',
        );
      }
      if (confirmation?.password) {
        const isMatch = await comparePassword(confirmation.password, user.passwordHash);
        if (!isMatch) {
          throw new AppError('Incorrect password', 400, 'INCORRECT_PASSWORD');
        }
      }
    } else {
      if (confirmation?.confirmation !== 'DELETE') {
        throw new AppError(
          'Type "DELETE" to confirm deletion of your account',
          400,
          'CONFIRMATION_REQUIRED',
        );
      }
    }

    await Promise.all([
      User.findByIdAndDelete(userId),
      Garden.deleteOne({ user: userId }),
      Bookmark.deleteMany({ user: userId }),
      Detection.deleteMany({ user: userId }),
      Review.deleteMany({ user: userId }),
      ActivityLog.deleteMany({ user: userId }),
    ]);
  }

  async getPreferences(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    return (
      user.preferences?.notifications || {
        newSubmission: true,
        roleApplication: true,
        support: true,
        flaggedReview: true,
        security: true,
        system: true,
      }
    );
  }

  async updatePreferences(userId: string, data: any) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const incoming = data?.notifications || data;
    const current = user.preferences?.notifications || {
      newSubmission: true,
      roleApplication: true,
      support: true,
      flaggedReview: true,
      security: true,
      system: true,
    };

    const updated = {
      newSubmission: incoming.newSubmission !== undefined ? Boolean(incoming.newSubmission) : current.newSubmission,
      roleApplication: incoming.roleApplication !== undefined ? Boolean(incoming.roleApplication) : current.roleApplication,
      support: incoming.support !== undefined ? Boolean(incoming.support) : current.support,
      flaggedReview: incoming.flaggedReview !== undefined ? Boolean(incoming.flaggedReview) : current.flaggedReview,
      security: incoming.security !== undefined ? Boolean(incoming.security) : current.security,
      system: incoming.system !== undefined ? Boolean(incoming.system) : current.system,
    };

    user.preferences = { notifications: updated };
    await user.save();

    return updated;
  }

  async getMyLoginHistory(userId: string) {
    const AuditLog = (await import('../admin/AuditLog.model')).default;
    const logs = await AuditLog.find({
      $or: [{ user: userId }, { 'newValue.email': (await User.findById(userId))?.email }],
      action: {
        $in: [
          'LOGIN',
          'LOGIN_FAILED',
          'LOGOUT',
          'LOGOUT_ALL',
          'REAUTH_SUCCESS',
          'REAUTH_FAILED',
          'TWO_FACTOR_ENABLE',
          'TWO_FACTOR_DISABLE',
        ],
      },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return logs.map((l) => ({
      id: l._id.toString(),
      action: l.action,
      severity: l.severity || 'INFO',
      ip: l.ipAddress,
      userAgent: l.userAgent,
      details: l.newValue,
      createdAt: l.createdAt,
    }));
  }
}

export const userService = new UserService();
