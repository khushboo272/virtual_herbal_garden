import User, { IUser } from '../models/User';
import Bookmark from '../models/Bookmark';
import Garden from '../models/Garden';
import Detection from '../models/Detection';
import Review from '../models/Review';
import ActivityLog from '../models/ActivityLog';
import { BookmarkEntityType, ActivityType, PaginationMeta } from '../types';
import { AppError } from '../utils/apiResponse';

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

  async getActivity(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [activities, total] = await Promise.all([
      ActivityLog.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments({ user: userId }),
    ]);
    return { activities, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } as PaginationMeta };
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
