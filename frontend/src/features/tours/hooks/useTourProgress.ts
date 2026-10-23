import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getTourProgress,
  completeCheckpoint as apiCompleteCheckpoint,
  submitQuiz as apiSubmitQuiz,
  syncProgress as apiSyncProgress,
  rateTour as apiRateTour,
  restartTour as apiRestartTour,
} from '../api/toursApi';
import type { TourProgress, TourCheckpoint, QuizSubmissionResult } from '../types/tour.types';

function getGuestStorageKey(slug: string): string {
  return `herb_tour_${slug}_progress`;
}

interface LocalGuestProgress {
  completedKeys: string[];
  lastCheckpointKey?: string | null;
}

function loadGuestProgress(slug: string): LocalGuestProgress {
  try {
    // 1. Check for legacy static progress import for "Virtual Herbal Garden Tour"
    if (slug === 'virtual-herbal-garden-tour') {
      const legacyRaw = localStorage.getItem('herb_tour_progress');
      if (legacyRaw) {
        try {
          const parsed = JSON.parse(legacyRaw);
          const legacyCompleted = Object.entries(parsed)
            .filter(([_, status]) => status === 'completed')
            .map(([id]) => id);

          if (legacyCompleted.length > 0) {
            localStorage.removeItem('herb_tour_progress'); // import only once
            const currentGuest = loadGuestProgressDirect(slug);
            const merged = Array.from(new Set([...currentGuest.completedKeys, ...legacyCompleted]));
            saveGuestProgress(slug, { completedKeys: merged, lastCheckpointKey: merged[merged.length - 1] });
            return { completedKeys: merged, lastCheckpointKey: merged[merged.length - 1] };
          }
        } catch {
          // ignore corrupted legacy storage
        }
      }
    }

    return loadGuestProgressDirect(slug);
  } catch {
    return { completedKeys: [] };
  }
}

function loadGuestProgressDirect(slug: string): LocalGuestProgress {
  try {
    const raw = localStorage.getItem(getGuestStorageKey(slug));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        completedKeys: Array.isArray(parsed.completedKeys) ? parsed.completedKeys : [],
        lastCheckpointKey: parsed.lastCheckpointKey || null,
      };
    }
  } catch {
    // fallback
  }
  return { completedKeys: [] };
}

function saveGuestProgress(slug: string, data: LocalGuestProgress): void {
  try {
    localStorage.setItem(getGuestStorageKey(slug), JSON.stringify(data));
  } catch {
    // localStorage full/blocked
  }
}

const EMPTY_CHECKPOINTS: TourCheckpoint[] = [];

export function useTourProgress(slug: string, checkpoints: TourCheckpoint[] = EMPTY_CHECKPOINTS, sequential = true) {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();

  // Stabilise the checkpoints reference so changing the array contents (not length)
  // does not re-fire effects unnecessarily.
  const checkpointCountRef = useRef(checkpoints.length);
  checkpointCountRef.current = checkpoints.length;

  // Keep a stable ref to the checkpoints array for use inside callbacks without
  // adding the array itself as a dependency (which changes every render).
  const checkpointsRef = useRef<TourCheckpoint[]>(checkpoints);
  checkpointsRef.current = checkpoints;

  const [progress, setProgress] = useState<TourProgress>({
    tourId: '',
    slug,
    percent: 0,
    completedKeys: [],
    quizResults: {},
    lastCheckpointKey: null,
    startedAt: null,
    completedAt: null,
    rating: null,
    ratingComment: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncAttemptedRef = useRef<boolean>(false);

  // Initialize or fetch progress — deps are stable primitives only.
  const fetchProgress = useCallback(async () => {
    if (!slug) return;
    // Wait until auth has finished initialising to avoid a guest→auth flicker.
    if (authIsLoading) return;
    setIsLoading(true);
    setError(null);

    if (isAuthenticated) {
      try {
        const guestData = loadGuestProgress(slug);

        // One-time sync of guest progress into user account
        if (!syncAttemptedRef.current && guestData.completedKeys.length > 0) {
          syncAttemptedRef.current = true;
          try {
            const synced = await apiSyncProgress(slug, guestData.completedKeys);
            localStorage.removeItem(getGuestStorageKey(slug));
            setProgress(synced);
            setIsLoading(false);
            return;
          } catch {
            // If sync fails, proceed to load normal server progress
          }
        }

        const serverData = await getTourProgress(slug);
        setProgress(serverData);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch tour progress');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Guest mode: load from localStorage
      const guest = loadGuestProgress(slug);
      const total = checkpointCountRef.current || 1;
      const pct = Math.min(100, Math.round((guest.completedKeys.length / total) * 100));

      setProgress({
        tourId: '',
        slug,
        percent: pct,
        completedKeys: guest.completedKeys,
        quizResults: {},
        lastCheckpointKey: guest.lastCheckpointKey || null,
        startedAt: guest.completedKeys.length > 0 ? new Date().toISOString() : null,
        completedAt:
          guest.completedKeys.length === checkpointCountRef.current && checkpointCountRef.current > 0
            ? new Date().toISOString()
            : null,
      });
      setIsLoading(false);
    }
  // Only depend on stable primitives — NOT on `checkpoints` array reference.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isAuthenticated, authIsLoading]);

  useEffect(() => {
    syncAttemptedRef.current = false;
    fetchProgress();
  }, [fetchProgress]);

  // Mark checkpoint complete (without quiz)
  const markComplete = useCallback(
    async (key: string): Promise<TourProgress> => {
      if (isAuthenticated) {
        setIsLoading(true);
        try {
          const updated = await apiCompleteCheckpoint(slug, key);
          setProgress(updated);
          return updated;
        } catch (err: any) {
          setError(err?.message || 'Failed to mark checkpoint complete');
          throw err;
        } finally {
          setIsLoading(false);
        }
      } else {
        // Guest mode — use functional updater to avoid depending on `progress` object.
        return new Promise<TourProgress>((resolve) => {
          setProgress((prev) => {
            const nextKeys = Array.from(new Set([...prev.completedKeys, key]));
            const total = checkpointCountRef.current || 1;
            const pct = Math.min(100, Math.round((nextKeys.length / total) * 100));
            const updated: TourProgress = {
              ...prev,
              completedKeys: nextKeys,
              lastCheckpointKey: key,
              percent: pct,
              completedAt:
                nextKeys.length === checkpointCountRef.current && checkpointCountRef.current > 0
                  ? new Date().toISOString()
                  : null,
            };
            saveGuestProgress(slug, { completedKeys: nextKeys, lastCheckpointKey: key });
            resolve(updated);
            return updated;
          });
        });
      }
    },
    // Removed `progress` and `checkpoints.length` from deps — use refs instead.
    [isAuthenticated, slug],
  );

  // Submit quiz answers to server
  const submitQuiz = useCallback(
    async (key: string, answers: number[]): Promise<QuizSubmissionResult> => {
      if (!isAuthenticated) {
        throw new Error('AUTH_REQUIRED');
      }
      setIsLoading(true);
      try {
        const result = await apiSubmitQuiz(slug, key, answers);
        // Refresh progress to reflect updated quiz completion status
        const updated = await getTourProgress(slug);
        setProgress(updated);
        return result;
      } catch (err: any) {
        setError(err?.message || 'Failed to submit quiz');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, slug],
  );

  // Submit rating for completed tour
  const rate = useCallback(
    async (rating: number, comment?: string) => {
      if (!isAuthenticated) throw new Error('You must be logged in to rate a tour');
      const res = await apiRateTour(slug, rating, comment);
      setProgress((prev) => ({ ...prev, rating: res.rating, ratingComment: comment }));
      return res;
    },
    [isAuthenticated, slug],
  );

  // Restart tour progress
  const restart = useCallback(async () => {
    if (isAuthenticated) {
      setIsLoading(true);
      try {
        const restarted = await apiRestartTour(slug);
        setProgress(restarted);
      } catch (err: any) {
        setError(err?.message || 'Failed to restart tour');
      } finally {
        setIsLoading(false);
      }
    } else {
      localStorage.removeItem(getGuestStorageKey(slug));
      setProgress({
        tourId: '',
        slug,
        percent: 0,
        completedKeys: [],
        quizResults: {},
        lastCheckpointKey: null,
      });
    }
  }, [isAuthenticated, slug]);

  // Stable memoised callbacks — read from refs, no array dependency.
  const isCompleted = useCallback(
    (key: string): boolean => {
      return progress.completedKeys.includes(key);
    },
    [progress.completedKeys],
  );

  const isUnlocked = useCallback(
    (order: number): boolean => {
      if (!sequential || order === 1) return true;
      const prevOrder = order - 1;
      const prevCp = checkpointsRef.current.find((c) => c.order === prevOrder);
      if (!prevCp) return true;
      return progress.completedKeys.includes(prevCp.key);
    },
    // `sequential` and `completedKeys` are the only things that actually change
    // the output. `checkpointsRef` is a ref so it's excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sequential, progress.completedKeys],
  );

  return {
    progress,
    completedKeys: progress.completedKeys,
    percent: progress.percent,
    isCompleted,
    isUnlocked,
    markComplete,
    completeCheckpoint: markComplete,
    submitQuiz,
    rate,
    restart,
    isLoading,
    error,
    isAuthenticated,
    reload: fetchProgress,
  };
}
