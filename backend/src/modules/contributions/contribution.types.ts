import { ContentStatus, IReviewNote } from '../../types';

export interface ContributionSummary {
  pendingReview: number;
  published: number;
  drafts: number;
  changesRequested: number;
  rejected: number;
  reviewsReceivedOnMyPlants: number;
  bookmarksOnMyContent: number;
  recent: ContributionRecentItem[];
}

export interface ContributionRecentItem {
  id: string;
  type: 'plant' | 'remedy';
  title: string;
  status: ContentStatus;
  updatedAt: Date;
  coverImage?: string;
  slug: string;
}

export interface ContributionListItem {
  id: string;
  type: 'plant' | 'remedy';
  title: string;
  slug: string;
  status: ContentStatus;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date | null;
  lastReviewComment?: string | null;
  scientificName?: string; // for plants
  referencesCount: number;
}

export interface ContributionDetailItem {
  id: string;
  type: 'plant' | 'remedy';
  title: string;
  slug: string;
  status: ContentStatus;
  reviewNotes: IReviewNote[];
  data: Record<string, unknown>;
}
