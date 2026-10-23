import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listTours } from '../api/toursApi';
import type { Tour, TourListResponse, TourListParams, TourLevel } from '../types/tour.types';

// Stable empty default so the hook's deps never get an unstable object reference.
const DEFAULT_PARAMS: TourListParams = {};

export function useTours(initialParams: TourListParams = DEFAULT_PARAMS) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params with fallbacks
  const urlQ = searchParams.get('q') || '';
  const urlHealth = searchParams.get('health') || '';
  const urlLevel = (searchParams.get('level') as TourLevel) || undefined;
  const urlSort = (searchParams.get('sort') as 'featured' | 'newest' | 'shortest') || 'featured';
  const urlPage = Number(searchParams.get('page')) || 1;

  const [searchInput, setSearchInput] = useState(urlQ);
  const [tours, setTours] = useState<Tour[]>([]);
  const [meta, setMeta] = useState<TourListResponse['meta']>({
    total: 0,
    page: urlPage,
    limit: 12,
    totalPages: 1,
    facets: { health: [], level: [] },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep a stable ref to initialParams so we can read it inside the callback
  // without adding the object (new reference every render) as a dependency.
  const initialParamsRef = useRef<TourListParams>(initialParams);
  initialParamsRef.current = initialParams;

  // Sync searchInput when URL changes externally (e.g. browser back/forward)
  useEffect(() => {
    setSearchInput(urlQ);
  }, [urlQ]);

  // Debounced search query update to URL (300ms)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchInput(text);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(() => {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (text.trim()) {
            next.set('q', text.trim());
          } else {
            next.delete('q');
          }
          next.set('page', '1');
          return next;
        });
      }, 300);
    },
    [setSearchParams],
  );

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const setHealth = useCallback(
    (healthSlug: string | undefined) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (healthSlug) {
          next.set('health', healthSlug);
        } else {
          next.delete('health');
        }
        next.set('page', '1');
        return next;
      });
    },
    [setSearchParams],
  );

  const setLevel = useCallback(
    (level: TourLevel | undefined) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (level) {
          next.set('level', level);
        } else {
          next.delete('level');
        }
        next.set('page', '1');
        return next;
      });
    },
    [setSearchParams],
  );

  const setSort = useCallback(
    (sort: 'featured' | 'newest' | 'shortest') => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('sort', sort);
        next.set('page', '1');
        return next;
      });
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (page: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(page));
        return next;
      });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Fetch data with abort controller
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchTours = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const response = await listTours(
        {
          q: urlQ || undefined,
          health: urlHealth || undefined,
          level: urlLevel,
          sort: urlSort,
          page: urlPage,
          limit: 12,
          // Read initialParams from ref — avoids object reference instability.
          ...initialParamsRef.current,
        },
        controller.signal,
      );

      setTours(response.tours);
      setMeta(response.meta);
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'canceled') return;
      setError(err?.message || 'Failed to load guided tours');
    } finally {
      setIsLoading(false);
    }
  // `initialParams` (object) intentionally excluded — read via ref inside.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQ, urlHealth, urlLevel, urlSort, urlPage]);

  useEffect(() => {
    fetchTours();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchTours]);

  return {
    tours,
    meta,
    isLoading,
    error,
    params: {
      q: urlQ,
      health: urlHealth,
      level: urlLevel,
      sort: urlSort,
      page: urlPage,
    },
    searchInput,
    setQuery: handleSearchChange,
    setHealth,
    setLevel,
    setSort,
    setPage,
    clearFilters,
    reload: fetchTours,
  };
}
