import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchPlants } from '../api/libraryApi';
import type { LibraryPlant, LibraryMeta, SearchParams } from '../types/library.types';
import { ApiError } from '../../../lib/api';

interface UsePlantSearchReturn {
  // Query values derived from URL
  params: SearchParams;
  // Imperative setters — each syncs to URL
  setQ: (q: string) => void;
  setMedicinalUse: (use: string) => void;
  setHealth: (health: string) => void;
  setRegion: (region: string) => void;
  setType: (type: string) => void;
  setSort: (sort: SearchParams['sort']) => void;
  setPage: (page: number) => void;
  setView: (view: 'grid' | 'list') => void;
  clearFilters: () => void;
  // Results
  plants: LibraryPlant[];
  meta: LibraryMeta | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

const DEFAULT_META: LibraryMeta = {
  total: 0,
  page: 1,
  limit: 12,
  totalPages: 0,
  exactMatch: null,
  facets: { medicinalUse: [], region: [], type: [] },
};

export function usePlantSearch(): UsePlantSearchReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [plants, setPlants] = useState<LibraryPlant[]>([]);
  const [meta, setMeta] = useState<LibraryMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // Parse URL params — URL is the single source of truth
  const params: SearchParams = {
    q: searchParams.get('q') || undefined,
    medicinalUse: searchParams.get('use') || undefined,
    health: searchParams.get('health') || undefined,
    region: searchParams.get('region') || undefined,
    type: searchParams.get('type') || undefined,
    sort: (searchParams.get('sort') as SearchParams['sort']) || 'newest',
    page: Number(searchParams.get('page')) || 1,
    view: (searchParams.get('view') as 'grid' | 'list') || 'grid',
    open: searchParams.get('open') || undefined,
  };

  // ── Fetch ──────────────────────────────────────────────────────────────
  const abortRef = useRef<AbortController | null>(null);

  const fetchResults = useCallback(async () => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const result = await searchPlants(params, controller.signal);
      if (controller.signal.aborted) return;

      setPlants(result.plants);
      setMeta(result.meta ?? DEFAULT_META);

      // open=1 + exactMatch → navigate straight to the plant detail
      if (params.open === '1' && result.meta?.exactMatch) {
        navigate(`/plant/${result.meta.exactMatch}`, { replace: true });
        return;
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const msg = err instanceof ApiError ? err.message : 'Failed to load plants';
      setError(msg);
      setPlants([]);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), retryKey]);

  useEffect(() => {
    fetchResults();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchResults]);

  // ── URL setters ────────────────────────────────────────────────────────

  function updateParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    // Reset page when filters change (except when explicitly setting page)
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next, { replace: true });
  }

  const setQ = (q: string) => updateParam('q', q || undefined);
  const setMedicinalUse = (use: string) => updateParam('use', use || undefined);
  const setHealth = (health: string) => updateParam('health', health || undefined);
  const setRegion = (region: string) => updateParam('region', region || undefined);
  const setType = (type: string) => updateParam('type', type || undefined);
  const setSort = (sort: SearchParams['sort']) => updateParam('sort', sort);
  const setPage = (page: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next, { replace: true });
  };
  const setView = (view: 'grid' | 'list') => {
    const next = new URLSearchParams(searchParams);
    next.set('view', view);
    setSearchParams(next, { replace: false });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (params.q) next.set('q', params.q);
    if (params.view && params.view !== 'grid') next.set('view', params.view);
    setSearchParams(next, { replace: true });
  };

  return {
    params,
    setQ,
    setMedicinalUse,
    setHealth,
    setRegion,
    setType,
    setSort,
    setPage,
    setView,
    clearFilters,
    plants,
    meta,
    isLoading,
    error,
    retry: () => setRetryKey((k) => k + 1),
  };
}
