// ──────────────────────────────────────────────────────────
// Shared TypeScript types matching backend Mongoose models
// ──────────────────────────────────────────────────────────

// ── Plant ────────────────────────────────────────────────

export interface PlantImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
  type?: string;
  thumbnailUrl?: string;
  cardUrl?: string;
  fullUrl?: string;
  lqip?: string;
}

export interface GrowingConditions {
  soil?: string;
  water?: string;
  sunlight?: string;
  climate?: string;
  hardinessZone?: string;
}

export interface Plant {
  _id: string;
  commonName: string;
  scientificName: string;
  slug: string;
  family: string;
  description: string;
  shortDescription: string | null;
  medicinalUses: string[];
  partsUsed: string[];
  toxicityLevel: string;
  ayurvedicNames: string[];
  regionNative: string[];
  growingConditions: GrowingConditions;
  images: PlantImage[];
  model3dUrl: string | null;
  placement3d?: {
    position: { x: number; y: number; z: number };
    scale: number;
  } | null;
  categories: string[];
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  avgRating: number;
  reviewCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Remedy ───────────────────────────────────────────────

export interface Ingredient {
  plantId?: string;
  partUsed?: string;
  quantity: string;
  unit: string;
  notes?: string;
}

export interface PreparationStep {
  step: number;
  instruction: string;
  durationMinutes?: number;
  imageUrl?: string;
}

export interface Remedy {
  _id: string;
  title: string;
  slug: string;
  description: string;
  plants: string[] | Plant[];
  ingredients: Ingredient[];
  preparationSteps: PreparationStep[];
  dosage: string;
  contraindications: string[];
  difficultyLevel: string;
  preparationTime: number;
  images: { url: string; alt?: string; isPrimary: boolean }[];
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Tour ─────────────────────────────────────────────────

export interface TourStop {
  order: number;
  plant: string | Plant;
  title: string;
  description: string;
  mediaUrl?: string;
  mediaType?: string;
  coordinates3d?: { x: number; y: number; z: number };
}

export interface Tour {
  _id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedDuration: number;
  coverImageUrl: string | null;
  stops: TourStop[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Detection ────────────────────────────────────────────

export interface Detection {
  _id: string;
  user: string;
  imageUrl: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: {
    plantId?: string;
    confidence: number;
    commonName: string;
    scientificName: string;
    medicinalUses: string[];
    additionalInfo?: Record<string, unknown>;
  };
  errorMessage?: string;
  createdAt: string;
}

// ── Review ───────────────────────────────────────────────

export interface Review {
  _id: string;
  plant: string;
  user: { _id: string; name: string; avatar?: string };
  rating: number;
  comment: string;
  createdAt: string;
}

// ── User ─────────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'GUEST' | 'USER' | 'BOTANIST' | 'ADMIN' | 'SUPER_ADMIN';
  avatar?: string;
  bio?: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ── Paginated Response ───────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Admin Stats ──────────────────────────────────────────

export interface AdminStats {
  totalPlants: number;
  totalUsers: number;
  totalViews: number;
  totalDetections: number;
  recentActivity: Array<{
    action: string;
    target: string;
    user: string;
    timestamp: string;
  }>;
}

// ── Bookmark ─────────────────────────────────────────────

export interface Bookmark {
  _id: string;
  user: string;
  plant: Plant;
  notes?: string;
  createdAt: string;
}

// ── Notification ─────────────────────────────────────────

export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}
