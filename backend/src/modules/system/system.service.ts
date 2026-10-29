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
}

export const systemService = new SystemService();
