// ──────────────────────────────────────────────────────────
// TourProgressContext — Progress state + localStorage
// ──────────────────────────────────────────────────────────

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { UserProgress, CheckpointStatus, TourProgressContextType } from '../app/virtualTour/types';
import { CHECKPOINTS } from '../app/virtualTour/checkpointData';

const STORAGE_KEY = 'herb_tour_progress';

const TourProgressContext = createContext<TourProgressContextType | null>(null);

function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage may be full or unavailable — silently fail
  }
}

export function TourProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(loadProgress);

  const persist = useCallback((next: UserProgress) => {
    setProgress(next);
    saveProgress(next);
  }, []);

  const startCheckpoint = useCallback(
    (id: string) => {
      setProgress((prev) => {
        if (prev[id] === 'completed') return prev; // don't regress
        const next = { ...prev, [id]: 'in_progress' as CheckpointStatus };
        saveProgress(next);
        return next;
      });
    },
    [],
  );

  const completeCheckpoint = useCallback(
    (id: string) => {
      setProgress((prev) => {
        const next = { ...prev, [id]: 'completed' as CheckpointStatus };
        saveProgress(next);
        return next;
      });
    },
    [],
  );

  const replayCheckpoint = useCallback(
    (id: string) => {
      // Replay does NOT change completion status — only logs replay
      try {
        const replayKey = `${STORAGE_KEY}_replay`;
        const raw = localStorage.getItem(replayKey);
        const counts: Record<string, number> = raw ? JSON.parse(raw) : {};
        counts[id] = (counts[id] || 0) + 1;
        localStorage.setItem(replayKey, JSON.stringify(counts));
      } catch {
        // silently fail
      }
    },
    [],
  );

  const getStatus = useCallback(
    (id: string): CheckpointStatus => {
      return progress[id] || 'not_started';
    },
    [progress],
  );

  const isUnlocked = useCallback(
    (index: number): boolean => {
      if (index === 0) return true;
      const prevCheckpoint = CHECKPOINTS[index - 1];
      return prevCheckpoint ? progress[prevCheckpoint.id] === 'completed' : false;
    },
    [progress],
  );

  const completedCount = CHECKPOINTS.filter((c) => progress[c.id] === 'completed').length;
  const progressPercentage = Math.round((completedCount / CHECKPOINTS.length) * 100);

  return (
    <TourProgressContext.Provider
      value={{
        progress,
        startCheckpoint,
        completeCheckpoint,
        replayCheckpoint,
        getStatus,
        isUnlocked,
        completedCount,
        progressPercentage,
      }}
    >
      {children}
    </TourProgressContext.Provider>
  );
}

export function useTourProgressContext(): TourProgressContextType {
  const context = useContext(TourProgressContext);
  if (!context) {
    throw new Error('useTourProgressContext must be used within a TourProgressProvider');
  }
  return context;
}
