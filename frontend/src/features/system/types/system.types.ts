export type SystemRole = 'GUEST' | 'USER' | 'BOTANIST' | 'ADMIN' | 'SUPER_ADMIN';

export interface ICapability {
  key: string;
  category: string;
  description: string;
  minimumRole: SystemRole;
  routeMethod: string;
  routePath: string;
}

export interface IAdminAccount {
  id: string;
  displayName: string;
  email: string;
  role: SystemRole;
  avatarUrl: string | null;
  isActive: boolean;
  is2faEnabled: boolean;
  provider: string;
  lastActiveAt: string;
  lastLoginAt: string | null;
  actionsInLast30Days: number;
  createdAt: string;
}

export interface IAuditLogItem {
  _id: string;
  user: {
    _id: string;
    displayName: string;
    email: string;
    role: SystemRole;
    avatarUrl?: string;
  } | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  requestId?: string | null;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface IAuditSummary {
  totals: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  actionCounts24h: Record<string, number>;
  topActors: Array<{
    user: {
      _id: string;
      displayName: string;
      email: string;
      role?: string;
      avatarUrl?: string;
    };
    count: number;
  }>;
}

export interface ISecurityEvents {
  suspiciousIps: Array<{
    ip: string;
    failedAttempts: number;
    lastAttempt: string;
    userAgent: string;
  }>;
  failedLogins: Array<{
    ip: string;
    day: string;
    count: number;
    lastAttempt: string;
  }>;
  lockouts: Array<{
    id: string;
    ip: string;
    userAgent: string;
    details: any;
    createdAt: string;
  }>;
  roleChanges: Array<{
    id: string;
    actor: any;
    oldValue: any;
    newValue: any;
    createdAt: string;
  }>;
  adminChanges: Array<{
    id: string;
    action: string;
    actor: any;
    details: any;
    createdAt: string;
  }>;
}

export interface ISessionItem {
  id: string;
  ip: string;
  userAgent: string;
  device: string;
  isCurrent: boolean;
  createdAt: string;
  lastUsedAt: string;
}

export interface INotificationPreferences {
  newSubmission: boolean;
  roleApplication: boolean;
  support: boolean;
  flaggedReview: boolean;
  security: boolean;
  system: boolean;
}

export interface ITwoFactorStatus {
  is2faEnabled: boolean;
  hasBackupCodes: boolean;
  remainingBackupCodes: number;
}

export interface ISubsystemHealth {
  database: {
    status: 'connected' | 'disconnected';
    name: string;
    host: string;
    readyState: number;
    latencyMs: number;
  };
  storage: {
    status: 'connected' | 'unconfigured' | 'error';
    configured: boolean;
    reachable: boolean;
    bucket: string;
    publicUrl: string;
    message: string;
  };
  socket: {
    status: 'active' | 'inactive';
    active: boolean;
    connectedClients: number;
  };
  ai: {
    status: 'ready' | 'degraded';
    model: string;
    configured: boolean;
    endpoint: string;
  };
  email: {
    configured: boolean;
    host: string;
    port: number;
    from: string;
  };
}

export interface IRuntimeSpecs {
  nodeVersion: string;
  platform: string;
  arch: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  environment: string;
  apiVersion: string;
  clientUrl: string;
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    heapPercent: number;
  };
}

export interface ISystemMetrics {
  users: {
    total: number;
    activeToday: number;
    superAdmins: number;
    admins: number;
    botanists: number;
    twoFactorEnrolled: number;
    twoFactorAdoptionRate: number;
  };
  content: {
    plantsTotal: number;
    plantsPublished: number;
    remediesTotal: number;
    remediesPublished: number;
    toursTotal: number;
    toursPublished: number;
    totalCatalogItems: number;
  };
  sessions: {
    activeSessionsTotal: number;
  };
  detections: {
    totalScans: number;
    completed: number;
    failed: number;
    successRate: number;
  };
}

export interface ICollectionItem {
  name: string;
  label: string;
  count: number;
  published?: number;
  drafts?: number;
  completed?: number;
  failed?: number;
  detail?: string;
  category: string;
  path: string;
}

export interface ISecurityPulse {
  failedLoginsLast24h: number;
  suspiciousIpsCount: number;
  recentEvents: Array<{
    id: string;
    action: string;
    severity: 'INFO' | 'WARN' | 'CRITICAL';
    actor: { displayName: string; email: string; role: string } | null;
    entityType: string;
    ipAddress: string;
    createdAt: string;
  }>;
}

export interface ISystemOverview {
  health: ISubsystemHealth;
  runtime: IRuntimeSpecs;
  metrics: ISystemMetrics;
  collections: ICollectionItem[];
  securityPulse: ISecurityPulse;
  policies: {
    maxUploadSizeMb: number;
    detectionTtlDays: number;
    refreshTokenExpiryDays: number;
    reauthExpiryMinutes: number;
    rateLimits: {
      global: number;
      auth: number;
      detection: number;
    };
  };
  generatedAt: string;
}

export interface ISubsystemPings {
  database: { ok: boolean; latencyMs: number };
  storage: { ok: boolean; latencyMs: number; message?: string };
  socket: { ok: boolean; latencyMs: number; connectedClients?: number };
  ai: { ok: boolean; latencyMs: number; model?: string };
  timestamp: string;
}

