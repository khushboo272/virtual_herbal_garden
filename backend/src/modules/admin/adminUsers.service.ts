import { Request } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../users/User.model';
import Detection from '../ai-scanner/Detection.model';
import Bookmark from '../users/Bookmark.model';
import Review from '../library/Review.model';
import TourProgress from '../tours/TourProgress.model';
import Plant from '../library/Plant.model';
import Remedy from '../remedies/Remedy.model';
import AuditLog from './AuditLog.model';
import { UserRole, AuditAction, NotificationType, PaginationMeta } from '../../types';
import { AppError } from '../../core/utils/apiResponse';
import { createAuditLog } from '../../core/utils/auditLogger';
import { authService } from '../auth/auth.service';
import { notificationService } from '../notifications/notification.service';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.GUEST]: 0,
  [UserRole.USER]: 1,
  [UserRole.BOTANIST]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4,
};

export interface ListUsersParams {
  q?: string;
  role?: string;
  status?: 'active' | 'banned';
  provider?: string;
  sort?: 'newest' | 'oldest' | 'name' | 'lastActive';
  page?: number;
  limit?: number;
}

export class AdminUsersService {
  /**
   * Enforces role mutation policy:
   * - Actor cannot modify themselves
   * - Actor cannot modify someone with equal or higher role
   * - ADMIN may only switch USER <-> BOTANIST
   * - SUPER_ADMIN may set USER, BOTANIST, ADMIN (cannot set SUPER_ADMIN via API)
   */
  async updateUserRole(
    targetUserId: string,
    newRole: UserRole,
    actorUserOrId: any,
    actorRoleOrReq?: UserRole | Request,
    optionalReq?: Request,
  ): Promise<IUser> {
    const actorId = typeof actorUserOrId === 'object' ? (actorUserOrId?.sub || actorUserOrId?._id?.toString()) : actorUserOrId;
    const actorRole = (typeof actorUserOrId === 'object' && actorUserOrId?.role)
      ? actorUserOrId.role
      : (typeof actorRoleOrReq === 'string' ? actorRoleOrReq : UserRole.ADMIN);
    const req = (optionalReq || (typeof actorRoleOrReq === 'object' ? actorRoleOrReq : undefined)) as Request;

    if (targetUserId === actorId) {
      throw new AppError('You cannot modify your own role', 403, 'FORBIDDEN');
    }

    if (newRole === UserRole.SUPER_ADMIN) {
      throw new AppError('Cannot promote to Super Admin via API', 403, 'FORBIDDEN');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    const actorLevel = ROLE_HIERARCHY[actorRole as UserRole] ?? 0;
    const targetLevel = ROLE_HIERARCHY[targetUser.role] ?? 0;

    // Nobody changes a user whose role is >= their own
    if (targetLevel >= actorLevel) {
      throw new AppError('Cannot modify a user with an equal or higher role', 403, 'FORBIDDEN');
    }

    // Role-specific constraints
    if (actorRole === UserRole.ADMIN) {
      if (newRole !== UserRole.USER && newRole !== UserRole.BOTANIST) {
        throw new AppError('Admins may only assign USER or BOTANIST roles', 403, 'FORBIDDEN');
      }
      if (targetUser.role !== UserRole.USER && targetUser.role !== UserRole.BOTANIST) {
        throw new AppError('Admins may only modify USER or BOTANIST accounts', 403, 'FORBIDDEN');
      }
    } else if (actorRole === UserRole.SUPER_ADMIN) {
      if (![UserRole.USER, UserRole.BOTANIST, UserRole.ADMIN].includes(newRole)) {
        throw new AppError('Invalid role assignment', 400, 'INVALID_ROLE');
      }
    } else {
      throw new AppError('Only administrators can update roles', 403, 'FORBIDDEN');
    }

    const oldRole = targetUser.role;
    targetUser.role = newRole;
    await targetUser.save();

    // 1. Audit log
    await createAuditLog({
      req,
      action: AuditAction.ROLE_CHANGE,
      entityType: 'User',
      entityId: targetUser._id.toString(),
      oldValue: { role: oldRole },
      newValue: { role: newRole },
    });

    // 2. Revoke refresh tokens so role change takes immediate effect
    await authService.logoutAll(targetUser._id.toString());

    // 3. Notify user
    await notificationService.createNotification(
      targetUser._id.toString(),
      NotificationType.SYSTEM,
      'Role Updated',
      `Your account role has been updated to ${newRole}. Please sign in again if prompted.`,
      '/dashboard',
    );

    return targetUser;
  }

  /**
   * Retrieves paginated list of users with search, role, status, and provider filtering.
   */
  async listUsers(params: ListUsersParams = {}): Promise<{
    users: Record<string, unknown>[];
    meta: PaginationMeta;
    items: Record<string, unknown>[];
    pagination: PaginationMeta;
    activeToday?: number;
    activeThisWeek?: number;
  }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (params.q && params.q.trim()) {
      const regex = new RegExp(params.q.trim(), 'i');
      query.$or = [{ email: regex }, { displayName: regex }];
    }

    if (params.role) {
      query.role = params.role;
    }

    if (params.status === 'active') {
      query.isActive = true;
      query.$or = [{ bannedUntil: null }, { bannedUntil: { $lte: new Date() } }];
    } else if (params.status === 'banned') {
      query.$or = [{ isActive: false }, { bannedUntil: { $gt: new Date() } }];
    }

    if (params.provider === 'google') {
      query['oauthAccounts.provider'] = 'google';
    } else if (params.provider === 'local') {
      query.$or = [{ oauthAccounts: { $size: 0 } }, { passwordHash: { $ne: null } }];
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (params.sort === 'oldest') sortOption = { createdAt: 1 };
    else if (params.sort === 'name') sortOption = { displayName: 1 };
    else if (params.sort === 'lastActive') sortOption = { lastActiveAt: -1 };

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash -totpSecret')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const formattedUsers = users.map((u) => {
      const isGoogle = Array.isArray(u.oauthAccounts) && u.oauthAccounts.some((a) => a.provider === 'google');
      const isCurrentlyBanned = !u.isActive || Boolean(u.bannedUntil && new Date(u.bannedUntil) > new Date());
      return {
        ...u,
        id: u._id.toString(),
        provider: isGoogle ? 'google' : 'local',
        isBanned: isCurrentlyBanned,
      };
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const [activeToday, activeThisWeek] = await Promise.all([
      User.countDocuments({ lastActiveAt: { $gte: startOfToday } }),
      User.countDocuments({ lastActiveAt: { $gte: startOfWeek } }),
    ]);

    return {
      users: formattedUsers,
      items: formattedUsers,
      activeToday,
      activeThisWeek,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves single user details including counts and activity logs.
   */
  async getUserDetail(userId: string): Promise<Record<string, unknown>> {
    const user = await User.findById(userId).select('-passwordHash -totpSecret').lean();
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const uId = new mongoose.Types.ObjectId(userId);

    const [
      scansCount,
      bookmarksCount,
      reviewsCount,
      toursCompletedCount,
      plantsCount,
      remediesCount,
      recentActivity,
    ] = await Promise.all([
      Detection.countDocuments({ user: uId }).catch(() => 0),
      Bookmark.countDocuments({ user: uId }).catch(() => 0),
      Review.countDocuments({ user: uId }).catch(() => 0),
      TourProgress.countDocuments({ user: uId, isCompleted: true }).catch(() => 0),
      Plant.countDocuments({ owner: uId, isDeleted: false }).catch(() => 0),
      Remedy.countDocuments({ owner: uId, isDeleted: false }).catch(() => 0),
      AuditLog.find({ user: uId }).sort({ createdAt: -1 }).limit(20).lean().catch(() => []),
    ]);

    const isGoogle = Array.isArray(user.oauthAccounts) && user.oauthAccounts.some((a) => a.provider === 'google');
    const isCurrentlyBanned = !user.isActive || Boolean(user.bannedUntil && new Date(user.bannedUntil) > new Date());

    return {
      user: {
        ...user,
        id: user._id.toString(),
        provider: isGoogle ? 'google' : 'local',
        isBanned: isCurrentlyBanned,
      },
      counts: {
        scans: scansCount,
        bookmarks: bookmarksCount,
        reviews: reviewsCount,
        tourCompletions: toursCompletedCount,
        contributions: plantsCount + remediesCount,
        plants: plantsCount,
        remedies: remediesCount,
      },
      recentActivity: recentActivity.map((a: any) => ({
        id: a._id.toString(),
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        createdAt: a.createdAt,
        ipAddress: a.ipAddress,
      })),
    };
  }

  async banUser(
    targetUserId: string,
    ban: boolean,
    reason?: string,
    bannedUntil?: string | Date,
    actorUserOrId?: any,
    req?: Request,
  ): Promise<IUser> {
    return this.setBanStatus(targetUserId, ban, reason, bannedUntil, actorUserOrId, UserRole.ADMIN, req);
  }

  /**
   * Ban or unban user with reason and optional until date.
   */
  async setBanStatus(
    targetUserId: string,
    ban: boolean,
    reason: string | undefined,
    bannedUntil: string | Date | undefined,
    actorUserOrId: any,
    actorRoleOrReq?: UserRole | Request,
    optionalReq?: Request,
  ): Promise<IUser> {
    const actorId = typeof actorUserOrId === 'object' ? (actorUserOrId?.sub || actorUserOrId?._id?.toString()) : actorUserOrId;
    const actorRole = (typeof actorUserOrId === 'object' && actorUserOrId?.role)
      ? actorUserOrId.role
      : (typeof actorRoleOrReq === 'string' ? actorRoleOrReq : UserRole.ADMIN);
    const req = (optionalReq || (typeof actorRoleOrReq === 'object' ? actorRoleOrReq : undefined)) as Request;

    if (targetUserId === actorId) {
      throw new AppError('You cannot ban your own account', 403, 'FORBIDDEN');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) throw new AppError('User not found', 404, 'NOT_FOUND');

    const actorLevel = ROLE_HIERARCHY[actorRole as UserRole] ?? 0;
    const targetLevel = ROLE_HIERARCHY[targetUser.role] ?? 0;

    if (targetLevel >= actorLevel) {
      throw new AppError('Cannot ban a user with an equal or higher role', 403, 'FORBIDDEN');
    }

    const oldStatus = { isActive: targetUser.isActive, banReason: targetUser.banReason, bannedUntil: targetUser.bannedUntil };

    if (ban) {
      targetUser.isActive = false;
      targetUser.banReason = reason?.trim() || 'Account suspended by administrator';
      targetUser.bannedUntil = bannedUntil ? new Date(bannedUntil) : null;
    } else {
      targetUser.isActive = true;
      targetUser.banReason = null;
      targetUser.bannedUntil = null;
    }

    await targetUser.save();

    // Revoke refresh tokens on ban
    if (ban) {
      await authService.logoutAll(targetUser._id.toString());
    }

    // Audit log
    await createAuditLog({
      req,
      action: ban ? AuditAction.UPDATE : AuditAction.UPDATE,
      entityType: 'User',
      entityId: targetUser._id.toString(),
      oldValue: oldStatus,
      newValue: { isActive: targetUser.isActive, banReason: targetUser.banReason, bannedUntil: targetUser.bannedUntil },
    });

    // Notify user
    await notificationService.createNotification(
      targetUser._id.toString(),
      NotificationType.SYSTEM,
      ban ? 'Account Suspended' : 'Account Reinstated',
      ban
        ? `Your account has been suspended: ${targetUser.banReason}`
        : 'Your account suspension has been lifted. You may now log in.',
      '/dashboard',
    );

    return targetUser;
  }

  /**
   * Forces logout of all user sessions.
   */
  async forceLogout(
    targetUserId: string,
    actorUserOrId: any,
    actorRoleOrReq?: UserRole | Request,
    optionalReq?: Request,
  ): Promise<void> {
    const actorId = typeof actorUserOrId === 'object' ? (actorUserOrId?.sub || actorUserOrId?._id?.toString()) : actorUserOrId;
    const actorRole = (typeof actorUserOrId === 'object' && actorUserOrId?.role)
      ? actorUserOrId.role
      : (typeof actorRoleOrReq === 'string' ? actorRoleOrReq : UserRole.ADMIN);
    const req = (optionalReq || (typeof actorRoleOrReq === 'object' ? actorRoleOrReq : undefined)) as Request;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) throw new AppError('User not found', 404, 'NOT_FOUND');

    const actorLevel = ROLE_HIERARCHY[actorRole as UserRole] ?? 0;
    const targetLevel = ROLE_HIERARCHY[targetUser.role] ?? 0;

    if (targetUserId !== actorId && targetLevel >= actorLevel) {
      throw new AppError('Cannot force logout a user with an equal or higher role', 403, 'FORBIDDEN');
    }

    await authService.logoutAll(targetUserId);

    await createAuditLog({
      req,
      action: AuditAction.LOGOUT,
      entityType: 'User',
      entityId: targetUserId,
      newValue: { forceLogout: true },
    });
  }
}

export const adminUsersService = new AdminUsersService();
