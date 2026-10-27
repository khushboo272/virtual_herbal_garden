export type TourLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface QuizQuestion {
  prompt: string;
  options: string[];
}

export interface QuizQuestionAdmin {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface TourCheckpoint {
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
    questions: QuizQuestion[];
  };
}

export interface TourCheckpointAdmin extends Omit<TourCheckpoint, 'quiz'> {
  quiz?: {
    passScore: number;
    questions: QuizQuestionAdmin[];
  };
}

export interface Tour {
  id: string;
  _id?: string;
  slug: string;
  title: string;
  summary: string;
  description?: string;
  coverImage?: string | null;
  coverImageUrl?: string | null;
  healthCategory?: string;
  level: TourLevel;
  difficulty?: string;
  tags?: string[];
  estimatedMinutes: number;
  estimatedDuration?: number;
  sequential: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
  checkpointCount?: number;
  checkpoints?: TourCheckpoint[];
  stops?: any[];
  createdBy?: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface TourProgress {
  tourId: string;
  slug: string;
  percent: number;
  completedKeys: string[];
  quizResults: Record<
    string,
    {
      bestScore: number;
      total: number;
      attempts: number;
      passed: boolean;
      lastAt: string;
    }
  >;
  lastCheckpointKey?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  rating?: number | null;
  ratingComment?: string | null;
}

export interface TourFacets {
  health: Array<{ slug: string; label: string; count: number }>;
  level: Array<{ name: string; count: number }>;
}

export interface TourListParams {
  q?: string;
  health?: string;
  level?: TourLevel;
  plant?: string;
  sort?: 'featured' | 'newest' | 'shortest';
  page?: number;
  limit?: number;
}

export interface TourListResponse {
  tours: Tour[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    facets: TourFacets;
  };
}

export interface QuizSubmissionResult {
  score: number;
  total: number;
  passed: boolean;
  results: Array<{
    correct: boolean;
    explanation: string;
  }>;
}

export interface TourAdminListItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  healthCategory?: string;
  level: TourLevel;
  isPublished: boolean;
  isFeatured: boolean;
  checkpointCount: number;
  startedCount: number;
  completedCount: number;
  createdAt: string;
}

export interface TourAdminAnalytics {
  totalTours: number;
  published: number;
  drafts?: number;
  featured?: number;
  totalStarts: number;
  totalCompletions: number;
  completionRate: number;
  overallAvgRating?: number;
  totalRatingsCount?: number;
}

export interface TourDetailAnalytics {
  tourId: string;
  slug: string;
  title: string;
  started: number;
  completed: number;
  completionRate: number;
  avgRating: number;
  avgQuizScore: number;
  tour?: {
    id: string;
    title: string;
    slug: string;
    summary?: string;
    level?: string;
    healthCategory?: string;
    isPublished: boolean;
    isFeatured: boolean;
    coverImageUrl?: string | null;
    estimatedMinutes?: number;
    checkpointsCount: number;
  };
  ratingDistribution?: Record<number, number>;
  ratingsList?: Array<{
    id: string;
    rating: number;
    comment: string | null;
    user: {
      displayName: string;
      email: string;
      avatarUrl: string | null;
    };
    createdAt: string;
  }>;
  recentSessions?: Array<{
    id: string;
    user: {
      id?: string;
      displayName: string;
      email: string;
      avatarUrl: string | null;
    };
    percent: number;
    completedCount: number;
    totalCheckpoints: number;
    isCompleted: boolean;
    lastCheckpointKey: string | null;
    rating: number | null;
    avgQuizScore: number | null;
    startedAt: string;
    completedAt: string | null;
    updatedAt: string;
  }>;
  perCheckpoint: Array<{
    key: string;
    title: string;
    order: number;
    durationMinutes?: number;
    reached: number;
    completed: number;
    dropOffPct: number;
    hasQuiz?: boolean;
    quizQuestionsCount?: number;
    quizAttempts?: number;
    quizPassRate?: number | null;
    quizAvgScore?: number | null;
    plantSlugs?: string[];
    remedySlugs?: string[];
    keyTakeaways?: string[];
    hasAudio?: boolean;
  }>;
}
