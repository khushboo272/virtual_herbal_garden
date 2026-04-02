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
}

export enum NotificationType {
  REVIEW = 'REVIEW',
  REPLY = 'REPLY',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ROLE_CHANGE = 'ROLE_CHANGE',
}

export enum ActivityType {
  VIEW_PLANT = 'VIEW_PLANT',
  DETECTION = 'DETECTION',
  REVIEW = 'REVIEW',
  GARDEN_UPDATE = 'GARDEN_UPDATE',
  BOOKMARK = 'BOOKMARK',
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
  plantId: Types.ObjectId;
  partUsed: PlantPart;
  quantity: string;
  unit: string;
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

export interface IDetectionFeedback {
  reviewer: Types.ObjectId;
  isCorrect: boolean;
  correctPlant?: Types.ObjectId;
  notes?: string;
  reviewedAt: Date;
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
