// ──────────────────────────────────────────────────────────
// ActivityWrapper — Selects the activity type per checkpoint
// ──────────────────────────────────────────────────────────

import type { Checkpoint, CheckpointStatus } from '../types';
import { QuizActivity } from './QuizActivity';

interface ActivityWrapperProps {
  checkpoint: Checkpoint;
  status: CheckpointStatus;
  onComplete: () => void;
}

export function ActivityWrapper({ checkpoint, status, onComplete }: ActivityWrapperProps) {
  const isCompleted = status === 'completed';

  // All checkpoints use quiz for now — extensible for drag-drop, etc.
  return (
    <QuizActivity
      questions={checkpoint.quiz}
      onPass={onComplete}
      isAlreadyCompleted={isCompleted}
    />
  );
}
