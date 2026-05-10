import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../lib/api';
import type { Plant, Remedy, Detection } from '../lib/types';

// ── Botanist Draft Plants ────────────────────────────────

export function useBotanistDrafts() {
  const [drafts, setDrafts] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ plants: Plant[]; total: number }>(
        '/plants',
        { includeUnpublished: true, authorOnly: true, limit: 50 },
      );
      // Filter to only drafts (not yet published)
      setDrafts((res.data.plants || []).filter(p => !p.isPublished));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load drafts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  return { drafts, isLoading, error, refetch: fetchDrafts };
}

// ── Botanist Submitted Plants (all, including published) ─

export function useBotanistPlants() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlants = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const res = await api.get<{ plants: Plant[]; total: number }>(
        '/plants',
        { includeUnpublished: true, authorOnly: true, page, limit },
      );
      setPlants(res.data.plants || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load plants');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlants(); }, [fetchPlants]);

  return { plants, total, isLoading, error, fetchPlants };
}

// ── Botanist Corrections (AI detection feedback) ─────────

export function useBotanistCorrections() {
  const [corrections, setCorrections] = useState<Detection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ detections: Detection[] }>(
          '/detections',
          { withFeedback: true, limit: 20 },
        );
        if (!cancelled) setCorrections(res.data.detections || []);
      } catch {
        // Silently fail — corrections are optional
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { corrections, isLoading };
}

// ── Botanist Stats (aggregate) ───────────────────────────

export function useBotanistStats() {
  const [stats, setStats] = useState<{
    totalDrafts: number;
    totalPublished: number;
    totalCorrections: number;
    pendingReview: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ plants: Plant[]; total: number }>(
          '/plants',
          { includeUnpublished: true, authorOnly: true, limit: 100 },
        );
        const allPlants = res.data.plants || [];
        if (!cancelled) {
          setStats({
            totalDrafts: allPlants.filter(p => !p.isPublished).length,
            totalPublished: allPlants.filter(p => p.isPublished).length,
            totalCorrections: 0, // Will be updated when corrections API exists
            pendingReview: allPlants.filter(p => !p.isPublished).length,
          });
        }
      } catch {
        if (!cancelled) setStats({ totalDrafts: 0, totalPublished: 0, totalCorrections: 0, pendingReview: 0 });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { stats, isLoading };
}
