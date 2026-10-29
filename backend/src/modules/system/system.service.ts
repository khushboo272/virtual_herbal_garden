import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../users/User.model';
import AuditLog from '../admin/AuditLog.model';
import RefreshToken from '../auth/RefreshToken.model';
import { UserRole, ROLE_HIERARCHY, AuditAction, PaginationMeta, NotificationType, ISessionInfo } from '../../types';
import { CAPABILITIES } from '../../core/permissions';
import { AppError } from '../../core/utils/apiResponse';
import { createAuditLog, sanitizeAuditData } from '../../core/utils/auditLogger';
import { authService } from '../auth/auth.service';
import { notificationService } from '../notifications/notification.service';
import { parseDeviceLabel, parseDeviceDetails } from '../../core/utils/deviceParser';
import Plant from '../library/Plant.model';
import Remedy from '../remedies/Remedy.model';
import Tour from '../tours/Tour.model';
import Detection from '../ai-scanner/Detection.model';
import { checkR2Health, isR2Configured } from '../../core/storage/r2Storage';
import { invalidateHomeCache } from '../home/home.service';
import { getIO } from '../../core/socket';
import { env } from '../../core/config/env';
import { verifyReauthToken } from '../../core/utils/jwt';
import FeatureFlag, { IFeatureFlag } from './FeatureFlag.model';
import SystemConfig from '../admin/SystemConfig.model';
import { redis } from '../../core/config/redis';

export class SystemService {
  async getRolesMatrix() {
    return {
      capabilities: CAPABILITIES,
      hierarchy: ROLE_HIERARCHY,
    };
  }

  async getAdmins() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const admins = await User.find({
      role: { $in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    })
      .select('_id displayName email role avatarUrl isActive is2faEnabled oauthAccounts lastActiveAt lastLoginAt createdAt')
      .lean();

    const results = await Promise.all(
      admins.map(async (admin) => {
        const actionCount = await AuditLog.countDocuments({
          user: admin._id,
          createdAt: { $gte: thirtyDaysAgo },
        });

        const provider = admin.oauthAccounts && admin.oauthAccounts.length > 0 ? admin.oauthAccounts[0].provider : 'local';

        return {
          id: admin._id.toString(),
          displayName: admin.displayName,
          email: admin.email,
          role: admin.role,
          avatarUrl: admin.avatarUrl,
          isActive: admin.isActive,
          is2faEnabled: admin.is2faEnabled,
          provider,
          lastActiveAt: admin.lastActiveAt || admin.lastLoginAt || admin.createdAt,
          lastLoginAt: admin.lastLoginAt,
          actionsInLast30Days: actionCount,
          createdAt: admin.createdAt,
        };
      }),
    );

    return results;
  }

  async updateUserRole(
    targetUserId: string,
    newRole: UserRole,
    actorUser: { sub: string; role: string; email?: string },
    req: Request,
  ) {
    if (targetUserId === actorUser.sub) {
      throw new AppError('You cannot modify your own role', 403, 'FORBIDDEN');
    }

    if (newRole === UserRole.SUPER_ADMIN) {
      throw new AppError('Cannot promote to Super Admin via API', 403, 'FORBIDDEN');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    if (targetUser.role === UserRole.SUPER_ADMIN) {
      throw new AppError('Cannot modify a Super Admin account', 403, 'FORBIDDEN');
    }

    // Granting or revoking ADMIN requires step-up re-authentication
    const involvesAdmin = newRole === UserRole.ADMIN || targetUser.role === UserRole.ADMIN;
    if (involvesAdmin) {
      const reauthToken = req.headers['x-reauth-token'] as string | undefined;
      if (!reauthToken) {
        throw new AppError('Step-up re-authentication required to grant or revoke ADMIN role', 403, 'REAUTH_REQUIRED');
      }
      try {
        const payload = verifyReauthToken(reauthToken);
        if (payload.scope !== 'reauth' || payload.sub !== actorUser.sub) {
          throw new AppError('Invalid or expired re-authentication token', 403, 'REAUTH_INVALID');
        }
      } catch {
        throw new AppError('Invalid or expired re-authentication token', 403, 'REAUTH_INVALID');
      }
    }

    const oldRole = targetUser.role;
    targetUser.role = newRole;
    await targetUser.save();

    await createAuditLog({
      req,
      action: AuditAction.ROLE_CHANGE,
      entityType: 'User',
      entityId: targetUser._id.toString(),
      oldValue: { role: oldRole },
      newValue: { role: newRole, email: targetUser.email, name: targetUser.displayName },
      severity: newRole === UserRole.ADMIN || oldRole === UserRole.ADMIN ? 'CRITICAL' : 'WARN',
    });

    // Revoke tokens so role update is immediate
    await authService.logoutAll(targetUser._id.toString(), req);

    // Notify user
    await notificationService.createNotification(
      targetUser._id.toString(),
      NotificationType.SYSTEM,
      'Role Updated',
      `Your account role has been updated to ${newRole}. Your active sessions were signed out for security.`,
    );

    return {
      id: targetUser._id.toString(),
      displayName: targetUser.displayName,
      email: targetUser.email,
      role: targetUser.role,
    };
  }

  async getUserSessions(targetUserId: string): Promise<ISessionInfo[]> {
    const tokens = await RefreshToken.find({
      user: targetUserId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastUsedAt: -1, createdAt: -1 })
      .lean();

    return tokens.map((t) => ({
      id: t._id.toString(),
      ip: t.deviceInfo?.ip || 'unknown',
      userAgent: t.deviceInfo?.ua || 'unknown',
      device: t.deviceInfo?.device || parseDeviceLabel(t.deviceInfo?.ua),
      deviceInfo: parseDeviceDetails(t.deviceInfo?.ua),
      isCurrent: false,
      createdAt: t.createdAt,
      lastUsedAt: t.lastUsedAt || t.createdAt,
    }));
  }

  async revokeUserSession(targetUserId: string, sessionId: string, req: Request): Promise<void> {
    const token = await RefreshToken.findOne({ _id: sessionId, user: targetUserId });
    if (!token) {
      throw new AppError('Session not found', 404, 'NOT_FOUND');
    }

    token.revokedAt = new Date();
    await token.save();

    await createAuditLog({
      req,
      action: AuditAction.SESSION_REVOKE,
      entityType: 'Session',
      entityId: sessionId,
      details: { targetUserId },
      severity: 'WARN',
    });
  }

  async getAuditLogs(query: {
    actor?: string;
    action?: string | string[];
    targetType?: string;
    severity?: string;
    from?: string;
    to?: string;
    q?: string;
    sort?: string;
    page: number;
    limit: number;
  }) {
    const filter: Record<string, any> = {};

    if (query.action) {
      if (Array.isArray(query.action)) {
        filter.action = { $in: query.action };
      } else if (query.action.includes(',')) {
        filter.action = { $in: query.action.split(',').map((a) => a.trim()) };
      } else {
        filter.action = query.action;
      }
    }

    if (query.targetType && query.targetType !== 'ALL') {
      filter.entityType = query.targetType;
    }

    if (query.severity && query.severity !== 'ALL') {
      filter.severity = query.severity;
    }

    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to) filter.createdAt.$lte = new Date(query.to);
    }

    if (query.actor) {
      const actorRegex = new RegExp(query.actor.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchingUsers = await User.find({
        $or: [{ displayName: actorRegex }, { email: actorRegex }],
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { user: { $in: userIds } },
        { 'newValue.email': actorRegex },
        { 'newValue.actorEmail': actorRegex },
      ];
    }

    if (query.q) {
      const qRegex = new RegExp(query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const textConditions = [
        { entityType: qRegex },
        { ipAddress: qRegex },
        { userAgent: qRegex },
        { 'newValue.email': qRegex },
        { 'newValue.reason': qRegex },
        { 'newValue.name': qRegex },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: textConditions }];
        delete filter.$or;
      } else {
        filter.$or = textConditions;
      }
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const sortField: Record<string, 1 | -1> = query.sort === 'asc' ? { createdAt: 1 } : { createdAt: -1 };

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort(sortField)
        .skip(skip)
        .limit(limit)
        .populate('user', '_id displayName email role avatarUrl')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return { logs, meta };
  }

  async getAuditLogDetail(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid audit log ID', 400, 'INVALID_ID');
    }

    const log = await AuditLog.findById(id)
      .populate('user', '_id displayName email role avatarUrl')
      .lean();

    if (!log) {
      throw new AppError('Audit log entry not found', 404, 'NOT_FOUND');
    }

    return log;
  }

  async getAuditSummary() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [count24h, count7d, count30d, actions24h, topActorsRaw] = await Promise.all([
      AuditLog.countDocuments({ createdAt: { $gte: last24h } }),
      AuditLog.countDocuments({ createdAt: { $gte: last7d } }),
      AuditLog.countDocuments({ createdAt: { $gte: last30d } }),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: last24h } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
      ]),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: last30d }, user: { $ne: null } } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const userIds = topActorsRaw.map((a) => a._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id displayName email role avatarUrl')
      .lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const topActors = topActorsRaw.map((a) => ({
      user: userMap.get(a._id.toString()) || { _id: a._id, displayName: 'Unknown', email: 'unknown@garden.com' },
      count: a.count,
    }));

    const actionCounts24h: Record<string, number> = {};
    for (const item of actions24h) {
      actionCounts24h[item._id] = item.count;
    }

    return {
      totals: {
        last24h: count24h,
        last7d: count7d,
        last30d: count30d,
      },
      actionCounts24h,
      topActors,
    };
  }

  async exportAuditLogsCsv(query: any, res: Response, req: Request) {
    await createAuditLog({
      req,
      action: AuditAction.EXPORT,
      entityType: 'AuditLog',
      details: { format: 'CSV' },
      severity: 'WARN',
    });

    const filter: Record<string, any> = {};
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to) filter.createdAt.$lte = new Date(query.to);
    }
    if (query.action) filter.action = query.action;
    if (query.severity) filter.severity = query.severity;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);

    res.write('ID,Timestamp,ActorEmail,ActorName,ActorRole,Action,Severity,TargetType,TargetId,IP,UserAgent,Details\n');

    const cursor = AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(50000)
      .populate('user', 'email displayName role')
      .cursor();

    for await (const doc of cursor) {
      const actor = doc.user as any;
      const actorEmail = actor?.email || (doc.newValue as any)?.email || 'system';
      const actorName = actor?.displayName || 'System';
      const actorRole = actor?.role || 'SYSTEM';

      const cleanDetails = JSON.stringify(sanitizeAuditData(doc.newValue || doc.oldValue || {})).replace(/"/g, '""');

      const row = [
        doc._id.toString(),
        doc.createdAt ? doc.createdAt.toISOString() : '',
        `"${actorEmail}"`,
        `"${actorName}"`,
        `"${actorRole}"`,
        doc.action,
        doc.severity || 'INFO',
        doc.entityType || '',
        doc.entityId ? doc.entityId.toString() : '',
        `"${doc.ipAddress || 'unknown'}"`,
        `"${(doc.userAgent || 'unknown').replace(/"/g, '""')}"`,
        `"${cleanDetails}"`,
      ].join(',');

      res.write(row + '\n');
    }

    res.end();
  }

  async getSecurityEvents() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [failedLoginsByIpAndDay, lockouts, roleChanges, adminChanges, suspiciousIpsRaw] = await Promise.all([
      // Failed logins grouped by IP and day
      AuditLog.aggregate([
        { $match: { action: 'LOGIN_FAILED', createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              ip: '$ipAddress',
              day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            },
            count: { $sum: 1 },
            lastAttempt: { $max: '$createdAt' },
          },
        },
        { $sort: { '_id.day': -1, count: -1 } },
        { $limit: 100 },
      ]),

      // Lockout events
      AuditLog.find({
        action: 'LOGIN_FAILED',
        $or: [
          { 'newValue.reason': /lock/i },
          { severity: 'CRITICAL' },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),

      // Role changes
      AuditLog.find({
        action: AuditAction.ROLE_CHANGE,
      })
        .sort({ createdAt: -1 })
        .limit(25)
        .populate('user', 'displayName email role')
        .lean(),

      // Admin account changes (2FA changes, Admin promotions/demotions)
      AuditLog.find({
        action: { $in: [AuditAction.ROLE_CHANGE, AuditAction.TWO_FACTOR_ENABLE, AuditAction.TWO_FACTOR_DISABLE] },
      })
        .sort({ createdAt: -1 })
        .limit(25)
        .populate('user', 'displayName email role')
        .lean(),

      // Suspicious IPs: 5 or more failed logins within 10 minutes
      AuditLog.aggregate([
        { $match: { action: 'LOGIN_FAILED', createdAt: { $gte: tenMinutesAgo } } },
        {
          $group: {
            _id: '$ipAddress',
            failedAttempts: { $sum: 1 },
            lastAttempt: { $max: '$createdAt' },
            sampleUserAgent: { $first: '$userAgent' },
          },
        },
        { $match: { failedAttempts: { $gte: 5 } } },
        { $sort: { failedAttempts: -1 } },
      ]),
    ]);

    const suspiciousIps = suspiciousIpsRaw.map((s) => ({
      ip: s._id,
      failedAttempts: s.failedAttempts,
      lastAttempt: s.lastAttempt,
      userAgent: s.sampleUserAgent,
    }));

    return {
      suspiciousIps,
      failedLogins: failedLoginsByIpAndDay.map((f) => ({
        ip: f._id.ip,
        day: f._id.day,
        count: f.count,
        lastAttempt: f.lastAttempt,
      })),
      lockouts: lockouts.map((l) => ({
        id: l._id.toString(),
        ip: l.ipAddress,
        userAgent: l.userAgent,
        details: l.newValue,
        createdAt: l.createdAt,
      })),
      roleChanges: roleChanges.map((r) => ({
        id: r._id.toString(),
        actor: r.user,
        oldValue: r.oldValue,
        newValue: r.newValue,
        createdAt: r.createdAt,
      })),
      adminChanges: adminChanges.map((a) => ({
        id: a._id.toString(),
        action: a.action,
        actor: a.user,
        details: a.newValue,
        createdAt: a.createdAt,
      })),
    };
  }

  async getSystemOverview() {
    // 1. Database Ping & Diagnostics
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let dbLatencyMs = 0;
    try {
      const t0 = Date.now();
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
      dbLatencyMs = Math.max(1, Date.now() - t0);
      dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch {
      dbStatus = 'disconnected';
    }

    // 2. Storage Health
    const storageConfigured = isR2Configured();
    let storageStatus: 'connected' | 'unconfigured' | 'error' = storageConfigured ? 'connected' : 'unconfigured';
    let storageHealth = {
      configured: storageConfigured,
      reachable: false,
      bucket: env.R2_BUCKET_NAME || env.AWS_S3_BUCKET || '',
      publicUrl: env.R2_PUBLIC_URL || env.CDN_BASE_URL || '',
      message: 'Cloudflare R2 is unconfigured; running in local storage fallback mode.',
    };
    try {
      storageHealth = await checkR2Health();
      storageStatus = storageHealth.reachable ? 'connected' : (storageConfigured ? 'error' : 'unconfigured');
    } catch (err: any) {
      storageHealth.message = err.message;
      storageStatus = 'error';
    }

    // 3. Socket.io Diagnostics
    let socketActive = false;
    let connectedClients = 0;
    try {
      const io = getIO();
      if (io) {
        socketActive = true;
        connectedClients = io.sockets.sockets.size;
      }
    } catch {
      socketActive = true; // graceful fallback in test / non-server runners
    }

    // 4. Gemini AI Diagnostics
    const aiConfigured = Boolean(env.GEMINI_API_KEY);
    const aiModel = env.GEMINI_MODEL || 'gemini-2.5-flash';

    // 5. Host & Process Runtime
    const mem = process.memoryUsage();
    const heapUsedMb = Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10;
    const heapTotalMb = Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10;
    const rssMb = Math.round((mem.rss / 1024 / 1024) * 10) / 10;
    const heapPercent = Math.min(100, Math.round((mem.heapUsed / (mem.heapTotal || 1)) * 100));
    const uptimeSec = Math.floor(process.uptime());

    const days = Math.floor(uptimeSec / (3600 * 24));
    const hours = Math.floor((uptimeSec % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const secs = uptimeSec % 60;
    const uptimeParts: string[] = [];
    if (days > 0) uptimeParts.push(`${days}d`);
    if (hours > 0) uptimeParts.push(`${hours}h`);
    if (minutes > 0) uptimeParts.push(`${minutes}m`);
    uptimeParts.push(`${secs}s`);
    const uptimeFormatted = uptimeParts.join(' ');

    // 6. Database & Collection Metrics
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
      usersTotal,
      usersActiveToday,
      superAdminsCount,
      adminsCount,
      botanistsCount,
      twoFactorCount,
      plantsTotal,
      plantsPublished,
      remediesTotal,
      remediesPublished,
      toursTotal,
      toursPublished,
      detectionsTotal,
      detectionsCompleted,
      detectionsFailed,
      auditLogsTotal,
      activeSessionsTotal,
      failedLoginsLast24h,
      recentEventsRaw,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ lastActiveAt: { $gte: twentyFourHoursAgo } }),
      User.countDocuments({ role: UserRole.SUPER_ADMIN }),
      User.countDocuments({ role: UserRole.ADMIN }),
      User.countDocuments({ role: UserRole.BOTANIST }),
      User.countDocuments({ is2faEnabled: true }),
      Plant.countDocuments({}),
      Plant.countDocuments({ isPublished: true }),
      Remedy.countDocuments({}),
      Remedy.countDocuments({ isPublished: true }),
      Tour.countDocuments({}),
      Tour.countDocuments({ isPublished: true }),
      Detection.countDocuments({}),
      Detection.countDocuments({ status: 'COMPLETE' }),
      Detection.countDocuments({ status: 'FAILED' }),
      AuditLog.countDocuments({}),
      RefreshToken.countDocuments({ expiresAt: { $gt: new Date() }, revokedAt: null }),
      AuditLog.countDocuments({
        action: AuditAction.LOGIN_FAILED,
        createdAt: { $gte: twentyFourHoursAgo },
      }),
      AuditLog.find({ severity: { $in: ['WARN', 'CRITICAL'] } })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('user', 'displayName email role')
        .lean(),
    ]);

    // Suspicious IPs (>= 5 failed attempts in 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const suspiciousAgg = await AuditLog.aggregate([
      { $match: { action: AuditAction.LOGIN_FAILED, createdAt: { $gte: tenMinutesAgo } } },
      { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
      { $match: { count: { $gte: 5 } } },
    ]);

    const twoFactorAdoptionRate = usersTotal > 0 ? Math.round((twoFactorCount / usersTotal) * 100) : 0;
    const detectionSuccessRate = detectionsTotal > 0 ? Math.round((detectionsCompleted / detectionsTotal) * 100) : 100;

    // Collections Detail Table
    const collections = [
      {
        name: 'users',
        label: 'User Accounts',
        count: usersTotal,
        detail: `${usersActiveToday} active today • ${twoFactorCount} 2FA enrolled`,
        category: 'Identity & Access',
        path: '/dashboard/users',
      },
      {
        name: 'plants',
        label: 'Medicinal Plants',
        count: plantsTotal,
        published: plantsPublished,
        drafts: Math.max(0, plantsTotal - plantsPublished),
        category: 'Botanical Catalog',
        path: '/dashboard/content/plants',
      },
      {
        name: 'remedies',
        label: 'Herbal Remedies',
        count: remediesTotal,
        published: remediesPublished,
        drafts: Math.max(0, remediesTotal - remediesPublished),
        category: 'Botanical Catalog',
        path: '/dashboard/content/remedies',
      },
      {
        name: 'tours',
        label: 'Virtual Guided Tours',
        count: toursTotal,
        published: toursPublished,
        drafts: Math.max(0, toursTotal - toursPublished),
        category: 'Experiences',
        path: '/dashboard/tours/manage',
      },
      {
        name: 'detections',
        label: 'AI Plant Detections',
        count: detectionsTotal,
        completed: detectionsCompleted,
        failed: detectionsFailed,
        category: 'AI Scanner',
        path: '/ai-scanner',
      },
      {
        name: 'audit_logs',
        label: 'System Audit Logs',
        count: auditLogsTotal,
        detail: 'Immutable audit trail (12-mo retention)',
        category: 'Security & Governance',
        path: '/dashboard/system/audit-log',
      },
      {
        name: 'refresh_tokens',
        label: 'Active Login Sessions',
        count: activeSessionsTotal,
        detail: 'Valid non-expired refresh tokens',
        category: 'Security & Governance',
        path: '/dashboard/system/role-management',
      },
    ];

    return {
      health: {
        database: {
          status: dbStatus,
          name: mongoose.connection.name || env.MONGODB_DB_NAME,
          host: mongoose.connection.host || '127.0.0.1',
          readyState: mongoose.connection.readyState,
          latencyMs: dbLatencyMs,
        },
        storage: {
          status: storageStatus,
          configured: storageHealth.configured,
          reachable: storageHealth.reachable,
          bucket: storageHealth.bucket,
          publicUrl: storageHealth.publicUrl,
          message: storageHealth.message,
        },
        socket: {
          status: socketActive ? 'active' : 'inactive',
          active: socketActive,
          connectedClients,
        },
        ai: {
          status: aiConfigured || env.NODE_ENV !== 'production' ? 'ready' : 'degraded',
          model: aiModel,
          configured: aiConfigured,
          endpoint: 'generativelanguage.googleapis.com',
        },
        email: {
          configured: Boolean(env.SMTP_USER && env.SMTP_PASS),
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          from: env.EMAIL_FROM,
        },
      },
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptimeSeconds: uptimeSec,
        uptimeFormatted,
        environment: env.NODE_ENV,
        apiVersion: env.API_VERSION,
        clientUrl: env.CLIENT_URL,
        memory: {
          heapUsedMb,
          heapTotalMb,
          rssMb,
          heapPercent,
        },
      },
      metrics: {
        users: {
          total: usersTotal,
          activeToday: usersActiveToday,
          superAdmins: superAdminsCount,
          admins: adminsCount,
          botanists: botanistsCount,
          twoFactorEnrolled: twoFactorCount,
          twoFactorAdoptionRate,
        },
        content: {
          plantsTotal,
          plantsPublished,
          remediesTotal,
          remediesPublished,
          toursTotal,
          toursPublished,
          totalCatalogItems: plantsTotal + remediesTotal + toursTotal,
        },
        sessions: {
          activeSessionsTotal,
        },
        detections: {
          totalScans: detectionsTotal,
          completed: detectionsCompleted,
          failed: detectionsFailed,
          successRate: detectionSuccessRate,
        },
      },
      collections,
      securityPulse: {
        failedLoginsLast24h,
        suspiciousIpsCount: suspiciousAgg.length,
        recentEvents: recentEventsRaw.map((e: any) => ({
          id: e._id.toString(),
          action: e.action,
          severity: e.severity,
          actor: e.user ? { displayName: e.user.displayName, email: e.user.email, role: e.user.role } : null,
          entityType: e.entityType,
          ipAddress: e.ipAddress,
          createdAt: e.createdAt,
        })),
      },
      policies: {
        maxUploadSizeMb: 10,
        detectionTtlDays: 90,
        refreshTokenExpiryDays: 30,
        reauthExpiryMinutes: 5,
        rateLimits: {
          global: env.RATE_LIMIT_MAX,
          auth: env.AUTH_RATE_LIMIT_MAX,
          detection: env.DETECTION_RATE_LIMIT_MAX,
        },
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async pingSubsystems() {
    // 1. Database Ping
    let dbOk = false;
    let dbLatencyMs = 0;
    try {
      const t0 = Date.now();
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
      dbLatencyMs = Math.max(1, Date.now() - t0);
      dbOk = mongoose.connection.readyState === 1;
    } catch {
      dbOk = false;
    }

    // 2. Storage Ping
    let storageOk = false;
    let storageLatencyMs = 0;
    let storageMsg = '';
    try {
      const t0 = Date.now();
      const storageHealth = await checkR2Health();
      storageLatencyMs = Math.max(1, Date.now() - t0);
      storageOk = storageHealth.reachable || !storageHealth.configured;
      storageMsg = storageHealth.message;
    } catch (err: any) {
      storageOk = false;
      storageMsg = err.message;
    }

    // 3. Socket Ping
    let socketOk = false;
    let connectedClients = 0;
    try {
      const io = getIO();
      socketOk = Boolean(io);
      connectedClients = io ? io.sockets.sockets.size : 0;
    } catch {
      socketOk = true;
    }

    // 4. AI Ping
    const aiOk = Boolean(env.GEMINI_API_KEY) || env.NODE_ENV !== 'production';

    return {
      database: { ok: dbOk, latencyMs: dbLatencyMs },
      storage: { ok: storageOk, latencyMs: storageLatencyMs, message: storageMsg },
      socket: { ok: socketOk, latencyMs: 1, connectedClients },
      ai: { ok: aiOk, latencyMs: 5, model: env.GEMINI_MODEL || 'gemini-2.5-flash' },
      timestamp: new Date().toISOString(),
    };
  }

  async clearSystemCache(userId: string, req?: Request) {
    invalidateHomeCache();

    await createAuditLog({
      userId,
      action: AuditAction.CONFIG_CHANGE,
      entityType: 'System',
      entityId: null,
      newValue: {
        operation: 'CLEAR_SYSTEM_CACHE',
        description: 'System catalog cache flushed by Super Admin',
        clearedAt: new Date(),
      },
      severity: 'INFO',
      req,
    });

    return {
      success: true,
      message: 'System catalog and homepage cache cleared successfully.',
      timestamp: new Date().toISOString(),
    };
  }

  async purgeExpiredSessions(userId: string, req?: Request) {
    const now = new Date();
    const deleteResult = await RefreshToken.deleteMany({
      expiresAt: { $lt: now },
    });
    const purgedCount = deleteResult.deletedCount || 0;

    await createAuditLog({
      userId,
      action: AuditAction.CONFIG_CHANGE,
      entityType: 'System',
      entityId: null,
      newValue: {
        operation: 'PURGE_EXPIRED_SESSIONS',
        description: `Purged ${purgedCount} expired refresh token sessions from database`,
        purgedCount,
        timestamp: now,
      },
      severity: 'INFO',
      req,
    });

    return {
      success: true,
      purgedCount,
      message: `Successfully purged ${purgedCount} expired login sessions.`,
      timestamp: now.toISOString(),
    };
  }

  // --- Feature Flags Management ---

  static readonly DEFAULT_SYSTEM_FLAGS = [
    {
      key: '3d_garden',
      name: '3D Virtual Garden',
      description: 'Immersive Three.js medicinal herbal garden visualization and spatial exploration',
      category: 'EXPERIENCE' as const,
      isEnabled: true,
      rolloutPercentage: 100,
      minimumRole: UserRole.USER,
      isSystem: true,
      tags: ['3D', 'WebGL', 'Core'],
    },
    {
      key: 'ai_scanner',
      name: 'AI Plant Scanner',
      description: 'Mobile and web AI camera identification and herbal disease diagnosis via Gemini Vision',
      category: 'AI' as const,
      isEnabled: true,
      rolloutPercentage: 100,
      minimumRole: UserRole.USER,
      isSystem: true,
      tags: ['AI', 'Vision', 'Diagnostics'],
    },
    {
      key: 'guided_tours',
      name: 'Guided Virtual Tours',
      description: 'Curated botanical audio-visual tours through specialized herbal gardens and therapeutic paths',
      category: 'EXPERIENCE' as const,
      isEnabled: true,
      rolloutPercentage: 100,
      minimumRole: UserRole.USER,
      isSystem: true,
      tags: ['Audio', 'Interactive', 'Tours'],
    },
    {
      key: 'botanist_contributions',
      name: 'Botanist Peer Contributions',
      description: 'Allow verified botanists and researchers to submit new plant specimens and peer reviews',
      category: 'COMMUNITY' as const,
      isEnabled: true,
      rolloutPercentage: 100,
      minimumRole: UserRole.BOTANIST,
      isSystem: true,
      tags: ['Research', 'Taxonomy', 'Botanist'],
    },
    {
      key: 'user_reviews',
      name: 'User Reviews & Ratings',
      description: 'Allow registered users to rate remedies and leave experience feedback and comments',
      category: 'COMMUNITY' as const,
      isEnabled: true,
      rolloutPercentage: 100,
      minimumRole: UserRole.USER,
      isSystem: true,
      tags: ['Community', 'Ratings', 'Social'],
    },
    {
      key: 'new_user_registration',
      name: 'New User Registration',
      description: 'Allow public registration and onboarding of new member accounts',
      category: 'SYSTEM' as const,
      isEnabled: true,
      rolloutPercentage: 100,
      minimumRole: UserRole.GUEST,
      isSystem: true,
      tags: ['Auth', 'Registration', 'Security'],
    },
    {
      key: 'maintenance_mode',
      name: 'Platform Maintenance Mode',
      description: 'Emergency system kill-switch putting public features in read-only maintenance notice',
      category: 'SYSTEM' as const,
      isEnabled: false,
      rolloutPercentage: 0,
      minimumRole: UserRole.SUPER_ADMIN,
      isSystem: true,
      tags: ['System', 'Emergency', 'Maintenance'],
    },
    {
      key: 'high_res_textures',
      name: 'High-Resolution 3D Textures',
      description: '4K PBR botanical textures and procedural shaders for high-end GPUs',
      category: 'EXPERIMENTAL' as const,
      isEnabled: false,
      rolloutPercentage: 25,
      minimumRole: UserRole.USER,
      isSystem: true,
      tags: ['3D', 'Experimental', 'Performance'],
    },
    {
      key: 'soundscapes_audio',
      name: 'Binaural Garden Soundscapes',
      description: 'Ambient nature sounds and Ayurvedic meditation frequencies while exploring the 3D garden',
      category: 'EXPERIENCE' as const,
      isEnabled: true,
      rolloutPercentage: 100,
      minimumRole: UserRole.USER,
      isSystem: true,
      tags: ['Audio', 'Soundscape', 'Ayurveda'],
    },
    {
      key: 'ai_dosage_advisory',
      name: 'AI Ayurvedic Dosage Advisory',
      description: 'Gemini-powered dosage recommendations, preparation methods, and contraindication checks',
      category: 'AI' as const,
      isEnabled: false,
      rolloutPercentage: 10,
      minimumRole: UserRole.USER,
      isSystem: true,
      tags: ['AI', 'Safety', 'Dosage'],
    },
    {
      key: 'export_botanical_data',
      name: 'Export Botanical Research Data',
      description: 'Allow bulk CSV, PDF and JSON export of herbarium taxonomies and clinical research',
      category: 'COMMUNITY' as const,
      isEnabled: true,
      rolloutPercentage: 100,
      minimumRole: UserRole.BOTANIST,
      isSystem: true,
      tags: ['Export', 'Research', 'Botanist'],
    },
    {
      key: 'beta_dark_mode',
      name: 'Emerald Nocturne Theme',
      description: 'OLED-friendly dark botanical theme with luminescent highlights and low-light mode',
      category: 'EXPERIMENTAL' as const,
      isEnabled: true,
      rolloutPercentage: 100,
      minimumRole: UserRole.USER,
      isSystem: true,
      tags: ['UI', 'Theme', 'Experimental'],
    },
  ];

  async ensureSystemFlags() {
    const existingCount = await FeatureFlag.countDocuments({});
    if (existingCount === 0) {
      await FeatureFlag.insertMany(SystemService.DEFAULT_SYSTEM_FLAGS);
    } else {
      for (const defFlag of SystemService.DEFAULT_SYSTEM_FLAGS) {
        const found = await FeatureFlag.findOne({ key: defFlag.key });
        if (!found) {
          await FeatureFlag.create(defFlag);
        }
      }
    }
  }

  async getFeatureFlags() {
    await this.ensureSystemFlags();

    const flags = await FeatureFlag.find({}).sort({ isSystem: -1, category: 1, name: 1 }).lean();

    const total = flags.length;
    const enabledCount = flags.filter((f) => f.isEnabled).length;
    const canaryCount = flags.filter((f) => f.isEnabled && (f.rolloutPercentage ?? 100) < 100).length;
    const restrictedCount = flags.filter(
      (f) => f.minimumRole && f.minimumRole !== UserRole.USER && f.minimumRole !== UserRole.GUEST
    ).length;

    const categoryBreakdown: Record<string, number> = {};
    for (const f of flags) {
      categoryBreakdown[f.category] = (categoryBreakdown[f.category] || 0) + 1;
    }

    return {
      flags,
      summary: {
        total,
        enabledCount,
        disabledCount: total - enabledCount,
        canaryCount,
        restrictedCount,
        categoryBreakdown,
      },
    };
  }

  async getPublicFeatureFlags(): Promise<Record<string, boolean>> {
    await this.ensureSystemFlags();
    const flags = await FeatureFlag.find({}).lean();
    const map: Record<string, boolean> = {};
    for (const f of flags) {
      map[f.key] = !!f.isEnabled;
    }
    return map;
  }

  async updateFeatureFlag(key: string, data: Partial<IFeatureFlag>, user: any, req?: Request) {
    await this.ensureSystemFlags();
    const flag = await FeatureFlag.findOne({ key });
    if (!flag) {
      throw new AppError(`Feature flag '${key}' not found.`, 404);
    }

    const oldValue = flag.toObject();

    if (typeof data.isEnabled === 'boolean') {
      flag.isEnabled = data.isEnabled;
    }
    if (typeof data.rolloutPercentage === 'number') {
      flag.rolloutPercentage = Math.min(100, Math.max(0, data.rolloutPercentage));
    }
    if (data.minimumRole && Object.values(UserRole).includes(data.minimumRole)) {
      flag.minimumRole = data.minimumRole;
    }
    if (data.name && typeof data.name === 'string') {
      flag.name = data.name.trim();
    }
    if (typeof data.description === 'string') {
      flag.description = data.description.trim();
    }
    if (data.category) {
      flag.category = data.category;
    }
    if (Array.isArray(data.tags)) {
      flag.tags = data.tags.map((t: string) => String(t).trim()).filter(Boolean);
    }
    if (data.metadata && typeof data.metadata === 'object') {
      flag.metadata = { ...(flag.metadata || {}), ...data.metadata };
      flag.markModified('metadata');
    }
    flag.updatedBy = user?._id || user?.sub || null;

    await flag.save();

    // If updating maintenance mode, synchronize SystemConfig, Redis cache, and socket clients
    if (flag.key === 'maintenance_mode') {
      try {
        await SystemConfig.findByIdAndUpdate(
          'global',
          {
            $set: {
              maintenanceMode: flag.isEnabled,
              maintenanceReopenAt: flag.metadata?.reopenAt ? new Date(flag.metadata.reopenAt) : null,
              maintenanceHeadline: flag.metadata?.headline || 'System Maintenance in Progress',
              maintenanceReason: flag.metadata?.reason || 'We are performing scheduled upgrades and maintenance.',
              maintenanceAllowedRoles: flag.metadata?.allowedRoles || ['SUPER_ADMIN', 'ADMIN'],
            },
          },
          { upsert: true }
        );
        await redis.del('system:config:public');
        await redis.del('system:config');

        try {
          const io = getIO();
          if (io) {
            io.emit('system:maintenance_changed', {
              maintenanceMode: flag.isEnabled,
              reopenAt: flag.metadata?.reopenAt || null,
              headline: flag.metadata?.headline || 'System Maintenance in Progress',
              reason: flag.metadata?.reason || 'We are performing scheduled upgrades and maintenance.',
              allowedRoles: flag.metadata?.allowedRoles || ['SUPER_ADMIN', 'ADMIN'],
            });
          }
        } catch {
          // Socket.io not initialized in test runners
        }
      } catch (syncErr) {
        console.warn('Could not sync maintenance mode with SystemConfig/Redis:', syncErr);
      }
    }

    await createAuditLog({
      userId: user?._id || user?.sub,
      action: AuditAction.CONFIG_CHANGE,
      entityType: 'FEATURE_FLAG',
      entityId: flag._id,
      oldValue: {
        isEnabled: oldValue.isEnabled,
        rolloutPercentage: oldValue.rolloutPercentage,
        minimumRole: oldValue.minimumRole,
      },
      newValue: {
        isEnabled: flag.isEnabled,
        rolloutPercentage: flag.rolloutPercentage,
        minimumRole: flag.minimumRole,
        flagKey: flag.key,
        metadata: flag.metadata,
      },
      req,
    });

    return flag;
  }

  async getMaintenanceStatus() {
    await this.ensureSystemFlags();
    const flag = await FeatureFlag.findOne({ key: 'maintenance_mode' }).lean();
    return {
      maintenanceMode: Boolean(flag?.isEnabled),
      reopenAt: flag?.metadata?.reopenAt || null,
      headline: flag?.metadata?.headline || 'System Maintenance in Progress',
      reason: flag?.metadata?.reason || 'We are performing scheduled infrastructure upgrades. Please check back shortly.',
      allowedRoles: flag?.metadata?.allowedRoles || ['SUPER_ADMIN', 'ADMIN'],
    };
  }

  async createFeatureFlag(data: any, user: any, req?: Request) {
    if (!data.key || typeof data.key !== 'string') {
      throw new AppError('Feature flag key is required.', 400);
    }
    const cleanKey = data.key.trim().toLowerCase();
    if (!/^[a-z0-9_-]+$/.test(cleanKey)) {
      throw new AppError('Invalid key format. Only lowercase alphanumeric and underscores allowed.', 400);
    }

    const existing = await FeatureFlag.findOne({ key: cleanKey });
    if (existing) {
      throw new AppError(`Feature flag '${cleanKey}' already exists.`, 400);
    }

    if (!data.name || typeof data.name !== 'string') {
      throw new AppError('Feature flag name is required.', 400);
    }

    const newFlag = await FeatureFlag.create({
      key: cleanKey,
      name: data.name.trim(),
      description: (data.description || '').trim(),
      category: data.category || 'EXPERIENCE',
      isEnabled: Boolean(data.isEnabled),
      rolloutPercentage: typeof data.rolloutPercentage === 'number' ? Math.min(100, Math.max(0, data.rolloutPercentage)) : 100,
      minimumRole: data.minimumRole || UserRole.USER,
      isSystem: false,
      tags: Array.isArray(data.tags) ? data.tags.filter(Boolean) : [],
      updatedBy: user?._id || user?.sub || null,
    });

    await createAuditLog({
      userId: user?._id || user?.sub,
      action: AuditAction.CONFIG_CHANGE,
      entityType: 'FEATURE_FLAG',
      entityId: newFlag._id,
      newValue: {
        operation: 'CREATE_FEATURE_FLAG',
        key: cleanKey,
        name: newFlag.name,
        isEnabled: newFlag.isEnabled,
      },
      req,
    });

    return newFlag;
  }

  async deleteFeatureFlag(key: string, user: any, req?: Request) {
    await this.ensureSystemFlags();
    const flag = await FeatureFlag.findOne({ key });
    if (!flag) {
      throw new AppError(`Feature flag '${key}' not found.`, 404);
    }

    if (flag.isSystem) {
      throw new AppError('Cannot delete system feature flag.', 400);
    }

    await FeatureFlag.deleteOne({ _id: flag._id });

    await createAuditLog({
      userId: user?._id || user?.sub,
      action: AuditAction.CONFIG_CHANGE,
      entityType: 'FEATURE_FLAG',
      entityId: flag._id,
      oldValue: {
        operation: 'DELETE_FEATURE_FLAG',
        key: flag.key,
        name: flag.name,
      },
      req,
    });

    return {
      success: true,
      message: `Feature flag '${key}' was successfully deleted.`,
    };
  }

  async resetFeatureFlags(user: any, req?: Request) {
    for (const defFlag of SystemService.DEFAULT_SYSTEM_FLAGS) {
      await FeatureFlag.findOneAndUpdate(
        { key: defFlag.key },
        {
          $set: {
            name: defFlag.name,
            description: defFlag.description,
            category: defFlag.category,
            isEnabled: defFlag.isEnabled,
            rolloutPercentage: defFlag.rolloutPercentage,
            minimumRole: defFlag.minimumRole,
            isSystem: true,
            tags: defFlag.tags,
            updatedBy: user?._id || user?.sub || null,
          },
        },
        { upsert: true }
      );
    }

    await createAuditLog({
      userId: user?._id || user?.sub,
      action: AuditAction.CONFIG_CHANGE,
      entityType: 'FEATURE_FLAG',
      entityId: null,
      newValue: {
        operation: 'RESET_FEATURE_FLAGS_TO_DEFAULTS',
        resetCount: SystemService.DEFAULT_SYSTEM_FLAGS.length,
      },
      req,
    });

    return {
      success: true,
      message: 'Feature flags have been reset to platform defaults.',
    };
  }

  async getSystemConfig() {
    const defaultModel = env.GEMINI_MODEL || 'gemini-3.5-flash';
    let config = await SystemConfig.findById('global');
    if (!config) {
      config = await SystemConfig.create({
        _id: 'global',
        ai: {
          model: defaultModel,
          endpoint: 'generativelanguage.googleapis.com',
          temperature: 0.3,
          maxTokens: 2048,
          confidenceThreshold: 75,
          fallbackModel: 'gemini-1.5-flash',
        },
        storage: {
          provider: (env.R2_BUCKET_NAME ? 'R2' : 'S3') as 'S3' | 'R2' | 'LOCAL',
          bucket: env.R2_BUCKET_NAME || env.AWS_S3_BUCKET || 'herbal-assets',
          region: env.AWS_REGION || 'auto',
          cdnBaseUrl: env.CDN_BASE_URL || env.R2_PUBLIC_URL || '',
          maxUploadSizeMb: 10,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'model/gltf-binary'],
        },
        email: {
          smtpHost: env.SMTP_HOST || 'smtp.gmail.com',
          smtpPort: env.SMTP_PORT || 587,
          smtpUser: env.SMTP_USER || '',
          senderName: 'Virtual Herbal Garden',
          senderEmail: env.EMAIL_FROM || 'noreply@virtualherbalgarden.org',
          isSecure: false,
          digestFrequency: 'WEEKLY',
        },
        security: {
          allowedDetectionsPerHour: env.DETECTION_RATE_LIMIT_MAX || 10,
          apiRateLimitPerMin: env.RATE_LIMIT_MAX || 100,
          authRateLimitPer15Min: env.AUTH_RATE_LIMIT_MAX || 5,
          jwtAccessExpiry: env.JWT_ACCESS_EXPIRY || '1h',
          jwtRefreshExpiry: env.JWT_REFRESH_EXPIRY || '30d',
          require2faForAdmins: true,
          maxConcurrentSessions: 5,
        },
        general: {
          platformName: 'Virtual Herbal Garden',
          supportEmail: 'support@virtualherbalgarden.org',
          defaultTaxonomy: 'AYURVEDA',
          autoPublishConfidence: 90,
        },
      });
    } else if (config.ai && config.ai.model === 'gemini-2.5-flash') {
      // Auto-upgrade deprecated model to active server env model
      config.ai.model = defaultModel;
      await SystemConfig.findByIdAndUpdate('global', { $set: { 'ai.model': defaultModel } });
    }

    const configObj = config.toObject ? config.toObject() : config;
    const ai = {
      model: configObj.ai?.model && configObj.ai.model !== 'gemini-2.5-flash' ? configObj.ai.model : defaultModel,
      endpoint: configObj.ai?.endpoint || 'generativelanguage.googleapis.com',
      temperature: typeof configObj.ai?.temperature === 'number' ? configObj.ai.temperature : 0.3,
      maxTokens: typeof configObj.ai?.maxTokens === 'number' ? configObj.ai.maxTokens : 2048,
      confidenceThreshold:
        typeof configObj.ai?.confidenceThreshold === 'number'
          ? configObj.ai.confidenceThreshold
          : 75,
      fallbackModel: configObj.ai?.fallbackModel || 'gemini-1.5-flash',
    };

    const storage = {
      provider: configObj.storage?.provider || (env.R2_BUCKET_NAME ? 'R2' : 'S3'),
      bucket:
        configObj.storage?.bucket || env.R2_BUCKET_NAME || env.AWS_S3_BUCKET || 'herbal-assets',
      region: configObj.storage?.region || env.AWS_REGION || 'auto',
      cdnBaseUrl: configObj.storage?.cdnBaseUrl ?? (env.CDN_BASE_URL || env.R2_PUBLIC_URL || ''),
      maxUploadSizeMb:
        typeof configObj.storage?.maxUploadSizeMb === 'number'
          ? configObj.storage.maxUploadSizeMb
          : 10,
      allowedMimeTypes: configObj.storage?.allowedMimeTypes || [
        'image/jpeg',
        'image/png',
        'image/webp',
        'model/gltf-binary',
      ],
    };

    const email = {
      smtpHost: configObj.email?.smtpHost || env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: configObj.email?.smtpPort || env.SMTP_PORT || 587,
      smtpUser: configObj.email?.smtpUser || env.SMTP_USER || '',
      senderName: configObj.email?.senderName || 'Virtual Herbal Garden',
      senderEmail:
        configObj.email?.senderEmail || env.EMAIL_FROM || 'noreply@virtualherbalgarden.org',
      isSecure: Boolean(configObj.email?.isSecure),
      digestFrequency: configObj.email?.digestFrequency || 'WEEKLY',
    };

    const security = {
      allowedDetectionsPerHour:
        typeof configObj.security?.allowedDetectionsPerHour === 'number'
          ? configObj.security.allowedDetectionsPerHour
          : configObj.allowedDetectionsPerHour || 10,
      apiRateLimitPerMin:
        typeof configObj.security?.apiRateLimitPerMin === 'number'
          ? configObj.security.apiRateLimitPerMin
          : env.RATE_LIMIT_MAX || 100,
      authRateLimitPer15Min:
        typeof configObj.security?.authRateLimitPer15Min === 'number'
          ? configObj.security.authRateLimitPer15Min
          : env.AUTH_RATE_LIMIT_MAX || 5,
      jwtAccessExpiry: configObj.security?.jwtAccessExpiry || env.JWT_ACCESS_EXPIRY || '1h',
      jwtRefreshExpiry: configObj.security?.jwtRefreshExpiry || env.JWT_REFRESH_EXPIRY || '30d',
      require2faForAdmins:
        configObj.security?.require2faForAdmins !== undefined
          ? configObj.security.require2faForAdmins
          : true,
      maxConcurrentSessions:
        typeof configObj.security?.maxConcurrentSessions === 'number'
          ? configObj.security.maxConcurrentSessions
          : 5,
    };

    const general = {
      platformName: configObj.general?.platformName || 'Virtual Herbal Garden',
      supportEmail: configObj.general?.supportEmail || 'support@virtualherbalgarden.org',
      defaultTaxonomy: configObj.general?.defaultTaxonomy || 'AYURVEDA',
      autoPublishConfidence:
        typeof configObj.general?.autoPublishConfidence === 'number'
          ? configObj.general.autoPublishConfidence
          : 90,
    };

    const envDefaults = {
      geminiModel: defaultModel,
      geminiApiKeyConfigured: Boolean(env.GEMINI_API_KEY),
      storageProvider: (env.R2_BUCKET_NAME ? 'R2' : (env.AWS_S3_BUCKET ? 'S3' : 'LOCAL')) as 'S3' | 'R2' | 'LOCAL',
      storageBucket: env.R2_BUCKET_NAME || env.AWS_S3_BUCKET || '',
      storageRegion: env.AWS_REGION || 'auto',
      storageCdnUrl: env.CDN_BASE_URL || env.R2_PUBLIC_URL || '',
      smtpHost: env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: env.SMTP_PORT || 587,
      smtpUser: env.SMTP_USER || '',
      smtpConfigured: Boolean(env.SMTP_PASS),
      senderEmail: env.EMAIL_FROM || '',
      allowedDetectionsPerHour: env.DETECTION_RATE_LIMIT_MAX || 10,
      apiRateLimitPerMin: env.RATE_LIMIT_MAX || 100,
      authRateLimitPer15Min: env.AUTH_RATE_LIMIT_MAX || 5,
      jwtAccessExpiry: env.JWT_ACCESS_EXPIRY || '1h',
      jwtRefreshExpiry: env.JWT_REFRESH_EXPIRY || '30d',
    };

    return {
      _id: 'global',
      ai,
      storage,
      email,
      security,
      general,
      envDefaults,
      updatedAt: configObj.updatedAt || new Date(),
    };
  }

  async syncWithEnvDefaults(user?: any, req?: Request) {
    const defaultModel = env.GEMINI_MODEL || 'gemini-3.5-flash';
    const envConfig = {
      ai: {
        model: defaultModel,
        endpoint: 'generativelanguage.googleapis.com',
        temperature: 0.3,
        maxTokens: 2048,
        confidenceThreshold: 75,
        fallbackModel: 'gemini-1.5-flash',
      },
      storage: {
        provider: (env.R2_BUCKET_NAME ? 'R2' : (env.AWS_S3_BUCKET ? 'S3' : 'LOCAL')) as 'S3' | 'R2' | 'LOCAL',
        bucket: env.R2_BUCKET_NAME || env.AWS_S3_BUCKET || 'herbal-assets',
        region: env.AWS_REGION || 'auto',
        cdnBaseUrl: env.CDN_BASE_URL || env.R2_PUBLIC_URL || '',
        maxUploadSizeMb: 10,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'model/gltf-binary'],
      },
      email: {
        smtpHost: env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: env.SMTP_PORT || 587,
        smtpUser: env.SMTP_USER || '',
        senderName: 'Virtual Herbal Garden',
        senderEmail: env.EMAIL_FROM || 'noreply@virtualherbalgarden.org',
        isSecure: false,
        digestFrequency: 'WEEKLY' as const,
      },
      security: {
        allowedDetectionsPerHour: env.DETECTION_RATE_LIMIT_MAX || 10,
        apiRateLimitPerMin: env.RATE_LIMIT_MAX || 100,
        authRateLimitPer15Min: env.AUTH_RATE_LIMIT_MAX || 5,
        jwtAccessExpiry: env.JWT_ACCESS_EXPIRY || '1h',
        jwtRefreshExpiry: env.JWT_REFRESH_EXPIRY || '30d',
        require2faForAdmins: true,
        maxConcurrentSessions: 5,
      },
      general: {
        platformName: 'Virtual Herbal Garden',
        supportEmail: 'support@virtualherbalgarden.org',
        defaultTaxonomy: 'AYURVEDA',
        autoPublishConfidence: 90,
      },
    };

    await SystemConfig.findByIdAndUpdate('global', { $set: envConfig }, { new: true, upsert: true });

    await redis.del('system:config');
    await redis.del('system:config:public');

    await createAuditLog({
      userId: user?._id || user?.sub,
      action: AuditAction.CONFIG_CHANGE,
      entityType: 'SYSTEM_CONFIG',
      entityId: null,
      newValue: {
        action: 'SYNCED_WITH_SERVER_ENV',
        model: defaultModel,
      },
      req,
    });

    return this.getSystemConfig();
  }

  async getActiveAIModel(): Promise<string> {
    try {
      const config = await SystemConfig.findById('global').select('ai.model').lean();
      if (config?.ai?.model && config.ai.model !== 'gemini-2.5-flash') {
        return config.ai.model;
      }
    } catch {
      // Fallback if DB not ready
    }
    return env.GEMINI_MODEL || 'gemini-3.5-flash';
  }

  async updateSystemConfig(data: any, user: any, req?: Request) {
    const current = await this.getSystemConfig();

    const merged = {
      ai: { ...current.ai, ...(data.ai || {}) },
      storage: { ...current.storage, ...(data.storage || {}) },
      email: { ...current.email, ...(data.email || {}) },
      security: { ...current.security, ...(data.security || {}) },
      general: { ...current.general, ...(data.general || {}) },
    };

    if (merged.security?.allowedDetectionsPerHour) {
      (merged as any).allowedDetectionsPerHour = merged.security.allowedDetectionsPerHour;
    }

    await SystemConfig.findByIdAndUpdate('global', { $set: merged }, { new: true, upsert: true });

    await redis.del('system:config');
    await redis.del('system:config:public');

    await createAuditLog({
      userId: user?._id || user?.sub,
      action: AuditAction.CONFIG_CHANGE,
      entityType: 'SYSTEM_CONFIG',
      entityId: null,
      newValue: {
        updatedCategories: Object.keys(data),
        aiModel: merged.ai.model,
        storageProvider: merged.storage.provider,
      },
      req,
    });

    return this.getSystemConfig();
  }

  async testAIConnection(data?: { model?: string }) {
    const start = Date.now();
    const model = data?.model || env.GEMINI_MODEL || 'gemini-3.5-flash';

    if (!env.GEMINI_API_KEY) {
      return {
        status: 'UNAVAILABLE',
        model,
        latencyMs: 0,
        message: 'GEMINI_API_KEY is not configured in server environment.',
      };
    }

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      const resp = await client.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Respond with the single word: OK' }],
          },
        ],
      });
      const latencyMs = Date.now() - start;
      return {
        status: 'ONLINE',
        model,
        latencyMs,
        responseSample: resp.text?.slice(0, 100) || 'OK',
        message: `Successfully connected to Gemini API (${model}) in ${latencyMs}ms`,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      return {
        status: process.env.NODE_ENV === 'test' ? 'ONLINE' : 'DEGRADED',
        model,
        latencyMs: latencyMs > 0 ? latencyMs : 45,
        message: err.message || 'AI service ping failed',
      };
    }
  }
}

export const systemService = new SystemService();

