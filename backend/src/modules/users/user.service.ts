import User, { IUser } from './User.model';
import Bookmark from './Bookmark.model';
import Garden from '../garden/Garden.model';
import Detection from '../ai-detection/Detection.model';
import Review from '../plants/Review.model';
import ActivityLog from '../notifications/ActivityLog.model';
import { BookmarkEntityType, ActivityType, PaginationMeta } from '../../types';
import { AppError } from '../../core/utils/apiResponse';

export class UserService {
  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId).select('-passwordHash -totpSecret');
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return user;
  }

  async updateProfile(userId: string, data: { displayName?: string; bio?: string }): Promise<IUser> {
    const user = await User.findByIdAndUpdate(userId, { $set: data }, { new: true })
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

  async getBookmarks(userId: string, entityType?: BookmarkEntityType) {
    const query: Record<string, unknown> = { user: userId };
    if (entityType) query.entityType = entityType;
    return Bookmark.find(query).sort({ createdAt: -1 }).lean();
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

  async deleteBookmark(userId: string, bookmarkId: string): Promise<void> {
    const r = await Bookmark.findOneAndDelete({ _id: bookmarkId, user: userId });
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

  async deleteAccount(userId: string): Promise<void> {
    await Promise.all([
      User.findByIdAndDelete(userId),
      Garden.deleteOne({ user: userId }),
      Bookmark.deleteMany({ user: userId }),
      Detection.deleteMany({ user: userId }),
      Review.deleteMany({ user: userId }),
      ActivityLog.deleteMany({ user: userId }),
    ]);
  }
}

export const userService = new UserService();
