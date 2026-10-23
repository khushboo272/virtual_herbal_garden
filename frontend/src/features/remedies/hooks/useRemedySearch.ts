import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listRemedies } from '../api/remediesApi';
import type { Remedy, RemedyMeta, RemedySearchParams } from '../types/remedy.types';
import { ApiError } from '../../../lib/api';

export function useRemedySearch() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL params
  const q = searchParams.get('q') || '';
  const health = searchParams.get('health') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const plant = searchParams.get('plant') || '';
  const sort = (searchParams.get('sort') || 'newest') as 'newest' | 'name' | 'quickest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Local state for debounced input
  const [searchInput, setSearchInput] = useState(q);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync search input when external URL changes
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [meta, setMeta] = useState<RemedyMeta>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to update search params
  const updateParams = useCallback(
    (updates: Partial<RemedySearchParams>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        });
        // Reset page to 1 if filter changed (unless page itself is being set)
        if (!('page' in updates)) {
          next.delete('page');
        }
        return next;
      });
    },
    [setSearchParams],
  );

  // Debounced search input setter
  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setSearchInput(newQuery);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        updateParams({ q: newQuery.trim() || undefined });
      }, 300);
    },
    [updateParams],
  );

  const setHealth = useCallback(
    (newHealth: string | null) => {
      updateParams({ health: newHealth || undefined });
    },
    [updateParams],
  );

  const setDifficulty = useCallback(
    (newDifficulty: string | null) => {
      updateParams({ difficulty: newDifficulty || undefined });
    },
    [updateParams],
  );

  const setSort = useCallback(
    (newSort: 'newest' | 'name' | 'quickest') => {
      updateParams({ sort: newSort });
    },
    [updateParams],
  );

  const setPage = useCallback(
    (newPage: number) => {
      updateParams({ page: newPage });
    },
    [updateParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Fetch data
  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await listRemedies(
          {
            q: q || undefined,
            health: health || undefined,
            difficulty: difficulty || undefined,
            plant: plant || undefined,
            sort,
            page,
            limit: 12,
          },
          signal,
        );
        setRemedies(result.remedies);
        setMeta(result.meta);
      } catch (err: any) {
        if (err?.name === 'AbortError' || signal?.aborted) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load remedies. Please try again.');
        setRemedies([]);
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [q, health, difficulty, plant, sort, page],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => {
      controller.abort();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [fetchData]);

  return {
    remedies,
    meta,
    isLoading,
    error,
    params: { q, health, difficulty, plant, sort, page },
    searchInput,
    setQuery: handleQueryChange,
    setHealth,
    setDifficulty,
    setSort,
    setPage,
    clearFilters,
    reload: () => fetchData(),
  };
}
