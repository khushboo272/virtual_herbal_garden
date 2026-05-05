// ──────────────────────────────────────────────────────────
// ProgressTracker — Your Progress card (PRD §5.3.1)
// ──────────────────────────────────────────────────────────

import { Award } from 'lucide-react';
import { motion } from 'motion/react';
import { useTourProgress } from '../../hooks/useTourProgress';
import { CHECKPOINTS } from './checkpointData';

export function ProgressTracker() {
  const { completedCount, progressPercentage } = useTourProgress();
  const totalCheckpoints = CHECKPOINTS.length;
  const isComplete = completedCount === totalCheckpoints;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="vt-progress-card"
    >
      {/* Left / Right content */}
      <div className="vt-progress-card__inner">
        <div className="vt-progress-card__left">
          <h2 className="vt-progress-card__title">Your Progress</h2>
          <p className="vt-progress-card__subtitle">
            {completedCount} of {totalCheckpoints} checkpoints completed
          </p>
        </div>
        <div className="vt-progress-card__right">
          <span className="vt-progress-card__percentage">{progressPercentage}%</span>
          <span className="vt-progress-card__complete-label">Complete</span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="vt-progress-bar"
        role="progressbar"
        aria-valuenow={progressPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Tour progress: ${progressPercentage}% complete, ${completedCount} of ${totalCheckpoints} checkpoints`}
      >
        <motion.div
          className="vt-progress-bar__fill"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* 100% celebration */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="vt-progress-card__celebration"
        >
          <Award className="vt-progress-card__celebration-icon" />
          <div>
            <p className="vt-progress-card__celebration-title">
              Congratulations! 🎉
            </p>
            <p className="vt-progress-card__celebration-subtitle">
              You&apos;ve completed all checkpoints in the Virtual Herbal Garden Tour!
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
