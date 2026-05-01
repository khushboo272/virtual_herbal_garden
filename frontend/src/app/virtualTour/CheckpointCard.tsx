// ──────────────────────────────────────────────────────────
// CheckpointCard — Individual checkpoint with alternating layout
// ──────────────────────────────────────────────────────────

import { CheckCircle2, Lock, Circle, Volume2, Clock, BookOpen, RotateCcw, Eye, Play } from 'lucide-react';
import { motion } from 'motion/react';
import type { Checkpoint, CheckpointStatus } from './types';

interface CheckpointCardProps {
  checkpoint: Checkpoint;
  index: number;
  status: CheckpointStatus;
  isUnlocked: boolean;
  onStart: (id: string) => void;
  onViewDetails: (id: string) => void;
  onReplay: (id: string) => void;
}

export function CheckpointCard({
  checkpoint,
  index,
  status,
  isUnlocked,
  onStart,
  onViewDetails,
  onReplay,
}: CheckpointCardProps) {
  const isLeft = index % 2 === 0; // Odd checkpoints (1,3,5) → circle LEFT
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  const isLocked = !isUnlocked;
  const isActive = isUnlocked && !isCompleted;

  // Status badge
  const badgeLabel = isCompleted
    ? 'Completed'
    : isInProgress
      ? 'In Progress'
      : isActive
        ? 'Available'
        : 'Locked';

  const badgeClass = isCompleted
    ? 'vt-badge--completed'
    : isInProgress || isActive
      ? 'vt-badge--in-progress'
      : 'vt-badge--locked';

  // CTA label for active cards
  const ctaLabel = isInProgress ? 'Continue' : 'Start';

  return (
    <motion.div
      className={`vt-checkpoint ${isLeft ? 'vt-checkpoint--left' : 'vt-checkpoint--right'}`}
      initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {/* Status Circle */}
      <div
        className={`vt-status-circle ${
          isCompleted
            ? 'vt-status-circle--completed'
            : isLocked
              ? 'vt-status-circle--locked'
              : 'vt-status-circle--active'
        }`}
        aria-label={`Checkpoint ${checkpoint.order}: ${badgeLabel}`}
      >
        {isCompleted ? (
          <CheckCircle2 className="vt-status-circle__icon" />
        ) : isLocked ? (
          <Lock className="vt-status-circle__icon vt-status-circle__icon--lock" />
        ) : (
          <Circle className="vt-status-circle__icon vt-status-circle__icon--empty" />
        )}
        {/* Pulsing ring for active */}
        {isActive && !isCompleted && (
          <motion.div
            className="vt-status-circle__pulse"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      {/* Card */}
      <div
        className={`vt-card ${
          isCompleted
            ? 'vt-card--completed'
            : isLocked
              ? 'vt-card--locked'
              : 'vt-card--active'
        }`}
      >
        {/* Card Header */}
        <div className="vt-card__header">
          <div className="vt-card__title-row">
            <h3 className="vt-card__title">
              {checkpoint.order}. {checkpoint.title}
            </h3>
            <span className={`vt-badge ${badgeClass}`}>{badgeLabel}</span>
          </div>
          <p className="vt-card__description">{checkpoint.description}</p>
        </div>

        {/* Metadata */}
        <div className="vt-card__meta">
          <span className="vt-card__meta-item">
            <Volume2 size={14} />
            Audio Narration
          </span>
          <span className="vt-card__meta-item">
            <Clock size={14} />
            {checkpoint.durationMinutes} min
          </span>
          {!isLocked && (
            <span className="vt-card__meta-item">
              <BookOpen size={14} />
              Interactive Activity
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="vt-card__actions">
          {isCompleted ? (
            <>
              <button
                className="vt-btn vt-btn--ghost"
                onClick={() => onViewDetails(checkpoint.id)}
                aria-label={`Review checkpoint: ${checkpoint.title}`}
              >
                <CheckCircle2 size={14} />
                Review Checkpoint
              </button>
              <button
                className="vt-btn vt-btn--ghost"
                onClick={() => onReplay(checkpoint.id)}
                aria-label={`Replay checkpoint: ${checkpoint.title}`}
              >
                <RotateCcw size={14} />
                Replay
              </button>
              <button
                className="vt-btn vt-btn--ghost"
                onClick={() => onViewDetails(checkpoint.id)}
                aria-label={`View details for: ${checkpoint.title}`}
              >
                <Eye size={14} />
                View Details
              </button>
            </>
          ) : isLocked ? (
            <button
              className="vt-btn vt-btn--disabled"
              disabled
              aria-label="Checkpoint locked — complete previous checkpoint first"
            >
              <Lock size={14} />
              Locked
            </button>
          ) : (
            <button
              className="vt-btn vt-btn--primary"
              onClick={() => onStart(checkpoint.id)}
              aria-label={`${ctaLabel} checkpoint: ${checkpoint.title}`}
            >
              <Play size={14} />
              {ctaLabel}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
