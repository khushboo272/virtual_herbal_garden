export type UserRole = 'GUEST' | 'USER' | 'BOTANIST' | 'ADMIN' | 'SUPER_ADMIN';

export type ModerationType = 'plant' | 'remedy' | 'application';

export interface DashboardStats {
  totalUsers: number;
  activeToday: number;
  publishedPlants: number;
  publishedRemedies: number;
  toursPublished: number;
  aiScansToday: number;
  pendingReview: number;
  pendingApplications: number;
}

export interface DashboardDeltas {
  newUsersThisWeek: number;
  userGrowthDeltaPercent: number;
}

export interface NeedsAttentionItem {
  id: string;
  title: string;
  type: 'plant' | 'remedy' | 'application';
  submittedAt: string;
  isOverdue: boolean;
  link: string;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  target: string;
  targetId: string | null;
  actor: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface DashboardSummaryData {
  stats: DashboardStats;
  deltas: DashboardDeltas;
  pendingByType: {
    plants: number;
    remedies: number;
    applications: number;
  };
  recentActivity: RecentActivityItem[];
  needsAttention: NeedsAttentionItem[];
}

export interface ModerationSummary {
  plants: number;
  remedies: number;
  applications: number;
  total: number;
}

export interface ModerationQueueItem {
  id: string;
  type: 'plant' | 'remedy';
  title: string;
  subtitle?: string;
  family?: string;
  slug: string;
  status: string;
  isPublished: boolean;
  submittedAt: string;
  daysAgo: number;
  isOverdue: boolean;
  owner: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string | null;
  };
  reviewNotesCount: number;
  flags: {
    hasHeroImage?: boolean;
    hasModel3d?: boolean;
    hasMedicinalUses?: boolean;
    hasReferences?: boolean;
    hasIngredients?: boolean;
    hasPreparationSteps?: boolean;
  };
}

export interface DuplicateCandidate {
  id: string;
  slug: string;
  commonName?: string;
  scientificName?: string;
  title?: string;
  similarity: string;
}

export interface ReviewHistoryNote {
  at: string;
  byUserId: {
    _id?: string;
    displayName?: string;
    email?: string;
  } | string;
  action: string;
  comment?: string;
}

export interface ModerationItemDetail {
  item: any;
  duplicateCandidates: DuplicateCandidate[];
  safetyFindings: {
    hasIssues: boolean;
    findings: Array<{ text: string; reason: string }>;
  };
  reviewHistory: ReviewHistoryNote[];
  queuePosition?: {
    prevId?: string | null;
    nextId?: string | null;
  };
}

export interface ContentItem {
  _id: string;
  commonName?: string;
  title?: string;
  scientificName?: string;
  family?: string;
  plantType?: string | null;
  slug: string;
  status: string;
  isPublished: boolean;
  isFeatured: boolean;
  images?: Array<{ url: string; isPrimary?: boolean }>;
  image?: string;
  coverImage?: string;
  coverImageUrl?: string;
  difficulty?: string;
  difficultyLevel?: string;
  preparationTime?: number;
  prepTimeMinutes?: number;
  tags?: string[];
  owner?: {
    _id: string;
    displayName?: string;
    name?: string;
    email?: string;
  };
  createdBy?: {
    _id: string;
    displayName?: string;
    name?: string;
    email?: string;
  };
  updatedAt: string;
  createdAt: string;
  [key: string]: any;
}

export interface ContentImpact {
  remedies: number;
  tours: number;
  userGardens: number;
  bookmarks: number;
  total: number;
}

export interface AdminUserListItem {
  id: string;
  _id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string | null;
  bannedUntil?: string | null;
  provider: 'google' | 'local';
  createdAt: string;
  lastActiveAt?: string | null;
}

export interface AdminUserDetail {
  user: AdminUserListItem;
  counts: {
    scans: number;
    bookmarks: number;
    reviews: number;
    tourCompletions: number;
    contributions: number;
    plants: number;
    remedies: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
    ipAddress?: string;
  }>;
}

export interface RoleApplicationItem {
  _id: string;
  userId: {
    _id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    role: UserRole;
    createdAt: string;
  };
  requestedRole: UserRole;
  motivation: string;
  qualifications: string;
  links: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewerId?: {
    _id: string;
    displayName: string;
  } | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  applicantStats?: {
    accountAgeDays: number;
    contributionsCount: number;
    scansCount: number;
  };
}

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
