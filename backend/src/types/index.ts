import { Types } from 'mongoose';

// ── Role Enum ──
export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  BOTANIST = 'BOTANIST',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.GUEST]: 0,
  [UserRole.USER]: 1,
  [UserRole.BOTANIST]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4,
};

// ── Enums ──
export enum ToxicityLevel {
  NONE = 'NONE',
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
}

export enum PlantPart {
  LEAVES = 'leaves',
  ROOTS = 'roots',
  BARK = 'bark',
  SEEDS = 'seeds',
  FLOWERS = 'flowers',
  RESIN = 'resin',
  FRUIT = 'fruit',
  STEM = 'stem',
  WHOLE_PLANT = 'whole_plant',
}

export enum GrowthStage {
  SEED = 'SEED',
  SPROUT = 'SPROUT',
  YOUNG = 'YOUNG',
  MATURE = 'MATURE',
  FLOWERING = 'FLOWERING',
}

export enum DetectionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  ADVANCED = 'ADVANCED',
}

export enum BookmarkEntityType {
  PLANT = 'PLANT',
  REMEDY = 'REMEDY',
  ARTICLE = 'ARTICLE',
  TOUR = 'TOUR',
}

export enum NotificationType {
  REVIEW = 'REVIEW',
  REPLY = 'REPLY',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
}

export type ReviewAction = 'SUBMITTED' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED' | 'WITHDRAWN';

export interface IReviewNote {
  at: Date;
  byUserId: Types.ObjectId;
  action: ReviewAction;
  comment?: string;
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  LOGOUT_ALL = 'LOGOUT_ALL',
  ROLE_CHANGE = 'ROLE_CHANGE',
  USER_BAN = 'USER_BAN',
  USER_UNBAN = 'USER_UNBAN',
  CONTENT_APPROVE = 'CONTENT_APPROVE',
  CONTENT_REJECT = 'CONTENT_REJECT',
  CONTENT_REQUEST_CHANGES = 'CONTENT_REQUEST_CHANGES',
  CONTENT_PUBLISH = 'CONTENT_PUBLISH',
  CONTENT_UNPUBLISH = 'CONTENT_UNPUBLISH',
  CONTENT_DELETE = 'CONTENT_DELETE',
  FEATURED_UPDATE = 'FEATURED_UPDATE',
  ANNOUNCEMENT_SEND = 'ANNOUNCEMENT_SEND',
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  EXPORT = 'EXPORT',
  REAUTH_SUCCESS = 'REAUTH_SUCCESS',
  REAUTH_FAILED = 'REAUTH_FAILED',
  SESSION_REVOKE = 'SESSION_REVOKE',
  TWO_FACTOR_ENABLE = 'TWO_FACTOR_ENABLE',
  TWO_FACTOR_DISABLE = 'TWO_FACTOR_DISABLE',
  TWO_FACTOR_BACKUP_GENERATE = 'TWO_FACTOR_BACKUP_GENERATE',
}

export interface INotificationPreferences {
  newSubmission: boolean;
  roleApplication: boolean;
  support: boolean;
  flaggedReview: boolean;
  security: boolean;
  system: boolean;
}

export interface ISessionInfo {
  id: string;
  ip: string;
  userAgent: string;
  device: string;
  deviceInfo?: {
    browser: string;
    os: string;
    device: string;
  };
  isCurrent: boolean;
  createdAt: Date;
  lastUsedAt: Date;
}

export enum ActivityType {
  VIEW_PLANT = 'VIEW_PLANT',
  DETECTION = 'DETECTION',
  REVIEW = 'REVIEW',
  GARDEN_UPDATE = 'GARDEN_UPDATE',
  BOOKMARK = 'BOOKMARK',
  COMPLETE_TOUR = 'COMPLETE_TOUR',
  SUBMISSION = 'SUBMISSION',
  CORRECTION_REQUEST = 'CORRECTION_REQUEST',
}

export enum ImageType {
  MAIN = 'main',
  DETAIL = 'detail',
  INFOGRAPHIC = 'infographic',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  PANORAMA = 'PANORAMA',
}

// ── Interfaces ──
export interface IOAuthAccount {
  provider: string;
  providerUserId: string;
  accessToken: string; // AES-256 encrypted
}

export interface IGrowingConditions {
  soil?: string;
  water?: string;
  sunlight?: string;
  climate?: string;
  hardinessZone?: string;
}

export interface IPlantImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
  type?: ImageType;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  cardUrl?: string;
  fullUrl?: string;
  lqip?: string;
}

export interface IIngredient {
  plantId?: Types.ObjectId;
  name?: string;
  partUsed?: PlantPart;
  quantity: string;
  unit?: string;
  notes?: string;
}

export interface IPreparationStep {
  step: number;
  instruction: string;
  durationMinutes?: number;
  imageUrl?: string;
}

export interface IRemedyImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface IGardenPlant {
  _id?: Types.ObjectId;
  plant: Types.ObjectId;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
  growthStage: GrowthStage;
  plantedAt: Date;
  notes?: string;
}

export interface IPrediction {
  plant: Types.ObjectId;
  confidence: number;
  rank: number;
  commonName: string;
}

export type DetectionVerdict = 'CORRECT' | 'INCORRECT' | 'NOT_A_PLANT' | 'UNSURE';

export interface IDetectionFeedback {
  reviewer: Types.ObjectId;
  verdict?: DetectionVerdict;
  isCorrect?: boolean;
  correctPlant?: Types.ObjectId;
  notes?: string;
  comment?: string;
  reviewedAt: Date;
}

export type TourLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface IQuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ITourCheckpoint {
  key: string;
  order: number;
  title: string;
  summary: string;
  body: string;
  durationMinutes: number;
  plantSlugs: string[];
  remedySlugs: string[];
  keyTakeaways: string[];
  audioUrl?: string;
  quiz?: {
    passScore: number;
    questions: IQuizQuestion[];
  };
}

export interface ITourStop {
  order: number;
  plant: Types.ObjectId;
  title: string;
  description: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  coordinates3d?: { x: number; y: number; z: number };
}

export interface IDeviceInfo {
  ua: string;
  ip: string;
  device?: string;
}

// ── API Response Types ──
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  facets?: Record<string, unknown>;
  exactMatch?: string | null;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// ── JWT Payload ──
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
