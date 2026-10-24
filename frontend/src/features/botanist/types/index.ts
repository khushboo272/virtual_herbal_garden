export type ContentStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'PUBLISHED'
  | 'REJECTED';

export type ReviewAction =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'CHANGES_REQUESTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface IReviewNote {
  at: string;
  byUserId?: string;
  action: ReviewAction;
  comment?: string;
}

export interface IContributionSummary {
  pendingReview: number;
  published: number;
  drafts: number;
  changesRequested: number;
  rejected: number;
  reviewsReceivedOnMyPlants: number;
  bookmarksOnMyContent: number;
  recent: IContributionItem[];
}

export interface IContributionItem {
  id: string;
  type: 'plant' | 'remedy';
  title: string;
  subtitle?: string;
  slug: string;
  status: ContentStatus;
  isPublished: boolean;
  submittedAt: string | null;
  updatedAt: string;
  createdAt: string;
  lastReviewComment?: string;
  lastReviewAction?: ReviewAction;
  reviewNotes?: IReviewNote[];
  references?: string[];
  thumbnail?: string;
}

export interface IPlantDraftInput {
  commonName: string;
  scientificName: string;
  family?: string;
  plantType?: string;
  nativeRegion?: string;
  description: string;
  medicinalUses: { use: string; details?: string }[] | string[];
  partsUsed: string[];
  keyBenefits: string[];
  regions?: string[];
  tags?: string[];
  aliases?: string[];
  sunlight?: string;
  waterRequirements?: string;
  soilType?: string;
  climate?: string;
  propagation?: string;
  toxicity?: string;
  precautions?: string[];
  references: string[];
}

export interface IRemedyDraftInput {
  title: string;
  summary?: string;
  description: string;
  difficultyLevel?: string;
  preparationTime?: number;
  usage?: 'INTERNAL' | 'TOPICAL' | 'INHALATION';
  ingredients: {
    name: string;
    quantity: string;
    plantId?: string;
  }[];
  preparationSteps: {
    stepNumber: number;
    instruction: string;
  }[];
  precautions?: string[];
  contraindications?: string[];
  traditionalSource?: string;
  references: string[];
}

export type FeedbackVerdict = 'CORRECT' | 'INCORRECT' | 'NOT_A_PLANT' | 'UNSURE';

export interface IAIFeedbackQueueItem {
  id: string;
  thumbnail: string | null;
  topMatch: {
    commonName: string;
    scientificName?: string;
    confidence: number;
    plantId?: string | null;
  } | null;
  alternatives: {
    commonName: string;
    scientificName?: string;
    confidence: number;
  }[];
  confidence: number;
  isPlant: boolean;
  myFeedback: {
    verdict: FeedbackVerdict;
    correctPlantId?: string | null;
    comment?: string;
    reviewedAt: string;
  } | null;
  reviewedCount: number;
  createdAt: string;
}

export interface IAIFeedbackStats {
  reviewedCount: number;
  accuracyRate: number;
  myReviews: number;
  pendingCount: number;
}
