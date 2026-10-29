export type FeatureFlagCategory = 'EXPERIENCE' | 'AI' | 'COMMUNITY' | 'SYSTEM' | 'EXPERIMENTAL';

export type UserRoleType = 'GUEST' | 'USER' | 'BOTANIST' | 'ADMIN' | 'SUPER_ADMIN';

export interface IFeatureFlag {
  _id?: string;
  key: string;
  name: string;
  description: string;
  category: FeatureFlagCategory;
  isEnabled: boolean;
  rolloutPercentage: number;
  minimumRole: UserRoleType;
  isSystem: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IMaintenanceStatus {
  maintenanceMode: boolean;
  reopenAt: string | null;
  headline: string;
  reason: string;
  allowedRoles: UserRoleType[];
}

export interface IFeatureFlagsSummary {
  total: number;
  enabledCount: number;
  disabledCount: number;
  canaryCount: number;
  restrictedCount: number;
  categoryBreakdown: Record<string, number>;
}

export interface IFeatureFlagsResponse {
  flags: IFeatureFlag[];
  summary: IFeatureFlagsSummary;
}

export interface ICreateFeatureFlagPayload {
  key: string;
  name: string;
  description: string;
  category: FeatureFlagCategory;
  isEnabled: boolean;
  rolloutPercentage: number;
  minimumRole: UserRoleType;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface IUpdateFeatureFlagPayload {
  name?: string;
  description?: string;
  category?: FeatureFlagCategory;
  isEnabled?: boolean;
  rolloutPercentage?: number;
  minimumRole?: UserRoleType;
  tags?: string[];
  metadata?: Record<string, any>;
}

