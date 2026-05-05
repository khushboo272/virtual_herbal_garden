// ──────────────────────────────────────────────────────────
// Virtual Herbal Garden Tour — TypeScript Types
// ──────────────────────────────────────────────────────────

export type CheckpointStatus = 'not_started' | 'in_progress' | 'completed';

export interface PlantData {
  name: string;
  scientificName?: string;
  image?: string;
  uses: string[];
}

export interface QuizQuestion {
  q: string;
  opts: string[];
  ans: number;   // index of correct answer in opts[]
  exp: string;   // explanation shown after answering
}

export interface Checkpoint {
  id: string;
  order: number;
  title: string;
  description: string;
  durationMinutes: number;
  plants: string[];
  intro: string;
  learning: string[];
  activityLabel: string;
  audioText: string;
  quiz: QuizQuestion[];
}

export interface UserProgress {
  [checkpointId: string]: CheckpointStatus;
}

export interface TourProgressContextType {
  progress: UserProgress;
  startCheckpoint: (id: string) => void;
  completeCheckpoint: (id: string) => void;
  replayCheckpoint: (id: string) => void;
  getStatus: (id: string) => CheckpointStatus;
  isUnlocked: (index: number) => boolean;
  completedCount: number;
  progressPercentage: number;
}
