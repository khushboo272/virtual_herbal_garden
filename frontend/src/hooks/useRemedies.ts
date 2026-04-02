import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../lib/api';
import type { Remedy } from '../lib/types';

interface UseRemediesOptions {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string;
}

export function useRemedies(options: UseRemediesOptions = {}) {
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { page = 1, limit = 20, search, tags } = options;

  const fetchRemedies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ remedies: Remedy[]; total: number }>(
        '/remedies',
        { page, limit, search, tags },
      );
      setRemedies(res.data.remedies || (Array.isArray(res.data) ? res.data as unknown as Remedy[] : []));
      setTotal(res.meta?.total ?? res.data.total ?? 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load remedies');
      setRemedies([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, tags]);

  useEffect(() => { fetchRemedies(); }, [fetchRemedies]);

  return { remedies, total, isLoading, error, refetch: fetchRemedies };
}

export function useRemedy(slug: string) {
  const [remedy, setRemedy] = useState<Remedy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const res = await api.get<Remedy>(`/remedies/${slug}`);
        if (!cancelled) setRemedy(res.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load remedy');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  return { remedy, isLoading, error };
}
