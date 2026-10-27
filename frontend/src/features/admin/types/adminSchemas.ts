import { z } from 'zod';

export const userRoleSchema = z.enum(['GUEST', 'USER', 'BOTANIST', 'ADMIN', 'SUPER_ADMIN']);

export const paginationDataSchema = z.object({
  total: z.number().default(0),
  page: z.number().default(1),
  limit: z.number().default(20),
  totalPages: z.number().default(1),
});

export const adminUserListItemSchema = z
  .object({
    id: z.string().nullish(),
    _id: z.string().nullish(),
    email: z.string().nullish().default(''),
    displayName: z.string().nullish().default('Unknown User'),
    avatarUrl: z.string().nullish().default(null),
    role: z.string().nullish().transform((r) => {
      const upper = (r || 'USER').toUpperCase();
      if (['GUEST', 'USER', 'BOTANIST', 'ADMIN', 'SUPER_ADMIN'].includes(upper)) {
        return upper as 'GUEST' | 'USER' | 'BOTANIST' | 'ADMIN' | 'SUPER_ADMIN';
      }
      return 'USER';
    }),
    isActive: z.boolean().nullish().transform((v) => v !== false),
    isBanned: z.boolean().nullish().transform((v) => Boolean(v)),
    banReason: z.string().nullish().default(null),
    bannedUntil: z.string().nullish().default(null),
    provider: z.string().nullish().transform((p) => (p?.toLowerCase() === 'google' ? 'google' : 'local')),
    createdAt: z.string().nullish().default(''),
    lastActiveAt: z.string().nullish().default(null),
  })
  .transform((u) => {
    const primaryId = u.id || u._id || '';
    return {
      id: primaryId,
      _id: primaryId,
      email: u.email || '',
      displayName: u.displayName || 'Unknown User',
      avatarUrl: u.avatarUrl || null,
      role: u.role,
      isActive: u.isActive,
      isBanned: u.isBanned,
      banReason: u.banReason || null,
      bannedUntil: u.bannedUntil || null,
      provider: u.provider,
      createdAt: u.createdAt || '',
      lastActiveAt: u.lastActiveAt || null,
    };
  });

export const adminUsersResponseSchema = z.object({
  items: z.array(adminUserListItemSchema).default([]),
  pagination: paginationDataSchema.default({ total: 0, page: 1, limit: 20, totalPages: 1 }),
  activeToday: z.number().nullish().default(0),
  activeThisWeek: z.number().nullish().default(0),
});

export const adminUserDetailSchema = z.object({
  user: adminUserListItemSchema,
  counts: z
    .object({
      scans: z.number().nullish().default(0),
      bookmarks: z.number().nullish().default(0),
      reviews: z.number().nullish().default(0),
      tourCompletions: z.number().nullish().default(0),
      contributions: z.number().nullish().default(0),
    })
    .default({ scans: 0, bookmarks: 0, reviews: 0, tourCompletions: 0, contributions: 0 }),
  activityLogs: z.array(z.any()).default([]),
});

export const moderationSummarySchema = z.object({
  plants: z.number().default(0),
  remedies: z.number().default(0),
  applications: z.number().default(0),
  total: z.number().default(0),
});

export const moderationQueueItemSchema = z.object({
  id: z.string(),
  type: z.enum(['plant', 'remedy']),
  title: z.string().default('Untitled'),
  subtitle: z.string().nullish(),
  family: z.string().nullish(),
  slug: z.string().default(''),
  status: z.string().default('PENDING_REVIEW'),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().optional().default(false),
  submittedAt: z.string().default(''),
  daysAgo: z.number().default(0),
  isOverdue: z.boolean().default(false),
  owner: z
    .object({
      id: z.string().default('unknown'),
      displayName: z.string().default('Unknown user'),
      email: z.string().default(''),
      avatarUrl: z.string().nullish().default(null),
    })
    .default({ id: 'unknown', displayName: 'Unknown user', email: '', avatarUrl: null }),
  reviewNotesCount: z.number().default(0),
  flags: z.record(z.string(), z.any()).default({}),
});

export const moderationQueueResponseSchema = z.object({
  items: z.array(moderationQueueItemSchema).default([]),
  pagination: paginationDataSchema.default({ total: 0, page: 1, limit: 20, totalPages: 1 }),
});

export const contentItemSchema = z.object({
  _id: z.string(),
  commonName: z.string().optional(),
  title: z.string().optional(),
  scientificName: z.string().optional(),
  family: z.string().optional(),
  slug: z.string().default(''),
  status: z.string().default('PUBLISHED'),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  images: z.array(z.object({ url: z.string(), isPrimary: z.boolean().optional() })).optional().default([]),
  owner: z
    .object({
      _id: z.string().optional(),
      displayName: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
  createdBy: z
    .object({
      _id: z.string().optional(),
      displayName: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
  updatedAt: z.string().default(''),
  createdAt: z.string().default(''),
});

export const contentListResponseSchema = z.object({
  items: z.array(contentItemSchema).default([]),
  pagination: paginationDataSchema.default({ total: 0, page: 1, limit: 20, totalPages: 1 }),
});

export const dashboardSummarySchema = z.object({
  stats: z.object({
    totalUsers: z.number().default(0),
    activeToday: z.number().default(0),
    publishedPlants: z.number().default(0),
    publishedRemedies: z.number().default(0),
    toursPublished: z.number().default(0),
    aiScansToday: z.number().default(0),
    pendingReview: z.number().default(0),
    pendingApplications: z.number().default(0),
  }),
  deltas: z.object({
    newUsersThisWeek: z.number().default(0),
    userGrowthDeltaPercent: z.number().default(0),
  }),
  pendingByType: z.object({
    plants: z.number().default(0),
    remedies: z.number().default(0),
    applications: z.number().default(0),
  }),
  recentActivity: z.array(z.any()).default([]),
  needsAttention: z.array(z.any()).default([]),
});

export const roleApplicationItemSchema = z.object({
  _id: z.string(),
  userId: z
    .object({
      _id: z.string(),
      displayName: z.string().nullish().default('Applicant'),
      email: z.string().nullish().default(''),
      role: z.string().optional(),
    })
    .nullish(),
  requestedRole: z.string().default('BOTANIST'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
  motivation: z.string().default(''),
  qualifications: z.string().default(''),
  links: z.array(z.string()).default([]),
  applicantStats: z
    .object({
      accountAgeDays: z.number().default(0),
      contributionsCount: z.number().default(0),
      scansCount: z.number().default(0),
    })
    .optional(),
  createdAt: z.string().default(''),
  updatedAt: z.string().default(''),
});

export const roleApplicationsResponseSchema = z.object({
  items: z.array(roleApplicationItemSchema).default([]),
  pagination: paginationDataSchema.default({ total: 0, page: 1, limit: 20, totalPages: 1 }),
});

export const adminStatsSchema = z.object({
  totalPlants: z.number().default(0),
  totalUsers: z.number().default(0),
  totalViews: z.number().default(0),
  totalDetections: z.number().default(0),
  recentActivity: z.array(z.any()).default([]),
});

export const adminOverviewStatsSchema = z.object({
  totalUsers: z.number().default(0),
  totalPlants: z.number().default(0),
  totalRemedies: z.number().default(0),
  detectionsThisMonth: z.number().default(0),
  signupChart: z.array(z.any()).default([]),
});

export const adminAnalyticsSchema = z.record(z.string(), z.any());

export const adminFlaggedReviewsResponseSchema = z.object({
  items: z.array(z.any()).default([]),
  pagination: paginationDataSchema.default({ total: 0, page: 1, limit: 20, totalPages: 1 }),
});

export const adminAuditLogsResponseSchema = z.object({
  items: z.array(z.any()).default([]),
  pagination: paginationDataSchema.default({ total: 0, page: 1, limit: 20, totalPages: 1 }),
});

export const systemHealthSchema = z.record(z.string(), z.string());

export const systemPublicConfigSchema = z.record(z.string(), z.any());

