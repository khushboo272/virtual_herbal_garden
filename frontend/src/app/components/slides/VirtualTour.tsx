// ──────────────────────────────────────────────────────────
// VirtualTour — Main page: hero + progress + checkpoint list
// ──────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Award } from 'lucide-react';
import { useTourProgress } from '../../../hooks/useTourProgress';
import { CHECKPOINTS } from '../../virtualTour/checkpointData';
import { ProgressTracker } from '../../virtualTour/ProgressTracker';
import { CheckpointCard } from '../../virtualTour/CheckpointCard';
import { CheckpointDetail } from '../../virtualTour/CheckpointDetail';
import type { Checkpoint } from '../../virtualTour/types';
import '../../virtualTour/virtualTour.css';

export function VirtualTour() {
  const {
    startCheckpoint,
    completeCheckpoint,
    replayCheckpoint,
    getStatus,
    isUnlocked,
    completedCount,
  } = useTourProgress();

  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [isReplay, setIsReplay] = useState(false);

  const handleStart = useCallback(
    (id: string) => {
      startCheckpoint(id);
      const cp = CHECKPOINTS.find((c) => c.id === id) || null;
      setSelectedCheckpoint(cp);
      setIsReplay(false);
    },
    [startCheckpoint],
  );

  const handleViewDetails = useCallback((id: string) => {
    const cp = CHECKPOINTS.find((c) => c.id === id) || null;
    setSelectedCheckpoint(cp);
    setIsReplay(false);
  }, []);

  const handleReplay = useCallback(
    (id: string) => {
      replayCheckpoint(id);
      const cp = CHECKPOINTS.find((c) => c.id === id) || null;
      setSelectedCheckpoint(cp);
      setIsReplay(true);
    },
    [replayCheckpoint],
  );

  const handleComplete = useCallback(
    (id: string) => {
      completeCheckpoint(id);
    },
    [completeCheckpoint],
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedCheckpoint(null);
    setIsReplay(false);
    // Stop any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const handleContinue = useCallback(() => {
    const next = CHECKPOINTS.find(
      (cp, idx) => getStatus(cp.id) !== 'completed' && isUnlocked(idx),
    );
    if (next) handleStart(next.id);
  }, [getStatus, isUnlocked, handleStart]);

  const isAllComplete = completedCount === CHECKPOINTS.length;

  return (
    <div className="vt-page">
      <div className="vt-container">
        {/* ─── Hero Section ─── */}
        <motion.div
          className="vt-hero"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="vt-hero__badge">Interactive Learning Journey</span>
          <h1 className="vt-hero__title">Virtual Herbal Garden Tour</h1>
          <p className="vt-hero__subtitle">
            Embark on a guided journey through the world of medicinal plants.
            <br />
            Learn at your own pace with interactive lessons and narrated content.
          </p>
        </motion.div>

        {/* ─── Progress Tracker ─── */}
        <ProgressTracker />

        {/* ─── Checkpoint List ─── */}
        <div className="vt-checkpoint-list">
          {CHECKPOINTS.map((checkpoint, index) => (
            <div key={checkpoint.id} className="vt-checkpoint-wrapper">
              {/* Connector line between cards */}
              {index > 0 && <div className="vt-connector" />}

              <CheckpointCard
                checkpoint={checkpoint}
                index={index}
                status={getStatus(checkpoint.id)}
                isUnlocked={isUnlocked(index)}
                onStart={handleStart}
                onViewDetails={handleViewDetails}
                onReplay={handleReplay}
              />
            </div>
          ))}
        </div>

        {/* ─── Continue / Certificate CTA ─── */}
        <motion.div
          className="vt-cta-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="vt-cta-card">
            <h3 className="vt-cta-card__title">
              {isAllComplete ? 'Tour Complete!' : 'Ready to Continue?'}
            </h3>
            <p className="vt-cta-card__text">
              {isAllComplete
                ? 'Congratulations on completing all checkpoints in the Virtual Herbal Garden Tour!'
                : 'Resume your journey from where you left off'}
            </p>
            <button
              className="vt-btn vt-btn--primary vt-btn--lg"
              onClick={isAllComplete ? undefined : handleContinue}
              disabled={isAllComplete}
              aria-label={isAllComplete ? 'Tour completed' : 'Continue to next checkpoint'}
            >
              {isAllComplete ? (
                <>
                  <Award size={18} />
                  All Checkpoints Done
                </>
              ) : (
                <>
                  Continue Tour
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* ─── Detail Modal ─── */}
      <CheckpointDetail
        checkpoint={selectedCheckpoint}
        status={selectedCheckpoint ? getStatus(selectedCheckpoint.id) : 'not_started'}
        onClose={handleCloseDetail}
        onComplete={handleComplete}
        isReplay={isReplay}
      />
    </div>
  );
}