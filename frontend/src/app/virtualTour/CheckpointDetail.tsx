// ──────────────────────────────────────────────────────────
// CheckpointDetail — Modal detail view for a checkpoint
// ──────────────────────────────────────────────────────────

import { X, BookOpen, CheckCircle2, Leaf, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useCallback } from 'react';
import type { Checkpoint, CheckpointStatus } from './types';
import { AudioPlayer } from './AudioPlayer';
import { ActivityWrapper } from './activities/ActivityWrapper';

interface CheckpointDetailProps {
  checkpoint: Checkpoint | null;
  status: CheckpointStatus;
  onClose: () => void;
  onComplete: (id: string) => void;
  isReplay?: boolean;
}

export function CheckpointDetail({
  checkpoint,
  status,
  onClose,
  onComplete,
  isReplay = false,
}: CheckpointDetailProps) {
  const isOpen = !!checkpoint;

  // Close on ESC
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!checkpoint) return null;

  const badgeLabel =
    status === 'completed' ? 'Completed' : status === 'in_progress' ? 'In Progress' : 'Not Started';
  const badgeClass =
    status === 'completed'
      ? 'vt-badge--completed'
      : status === 'in_progress'
        ? 'vt-badge--in-progress'
        : 'vt-badge--locked';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="vt-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="vt-modal"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Checkpoint ${checkpoint.order}: ${checkpoint.title}`}
          >
            {/* Sticky Header */}
            <div className="vt-modal__header">
              <div className="vt-modal__header-content">
                <h2 className="vt-modal__title">
                  {checkpoint.order}. {checkpoint.title}
                </h2>
                <p className="vt-modal__subtitle">{checkpoint.description}</p>
                <span className={`vt-badge ${badgeClass}`}>{badgeLabel}</span>
              </div>
              <button
                className="vt-modal__close"
                onClick={onClose}
                aria-label="Close checkpoint details"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="vt-modal__body">
              {/* Introduction */}
              <section className="vt-modal__section vt-modal__section--intro">
                <h3 className="vt-modal__section-title">
                  <BookOpen size={16} />
                  Introduction
                </h3>
                <p className="vt-modal__section-text">{checkpoint.intro}</p>
              </section>

              {/* Key Learning Points */}
              {checkpoint.learning.length > 0 && (
                <section className="vt-modal__section">
                  <h3 className="vt-modal__section-title">
                    <CheckCircle2 size={16} />
                    Key Learning Points
                  </h3>
                  <ul className="vt-modal__learning-list">
                    {checkpoint.learning.map((point, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="vt-modal__learning-item"
                      >
                        <CheckCircle2 size={16} className="vt-modal__learning-check" />
                        {point}
                      </motion.li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Featured Plants */}
              {checkpoint.plants.length > 0 && (
                <section className="vt-modal__section">
                  <h3 className="vt-modal__section-title">
                    <Leaf size={16} />
                    Featured Plants
                  </h3>
                  <div className="vt-modal__plants">
                    {checkpoint.plants.map((plant, idx) => (
                      <motion.span
                        key={idx}
                        className="vt-plant-tag"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.08 }}
                      >
                        {plant}
                      </motion.span>
                    ))}
                  </div>
                </section>
              )}

              {/* Audio Narration */}
              <section className="vt-modal__section">
                <AudioPlayer
                  text={checkpoint.audioText}
                  durationMinutes={checkpoint.durationMinutes}
                  autoReplay={isReplay}
                />
              </section>

              {/* Interactive Activity */}
              <section className="vt-modal__section vt-modal__section--activity">
                <h3 className="vt-modal__section-title">
                  <Sparkles size={16} />
                  Interactive Activity
                </h3>
                <p className="vt-modal__activity-label">{checkpoint.activityLabel}</p>
                <ActivityWrapper
                  checkpoint={checkpoint}
                  status={status}
                  onComplete={() => onComplete(checkpoint.id)}
                />
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
