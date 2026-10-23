import { useState, useEffect, useCallback } from 'react';
import { getRemedy, getRelatedRemedies } from '../api/remediesApi';
import type { Remedy } from '../types/remedy.types';
import { ApiError } from '../../../lib/api';

export function useRemedy(slugOrId: string) {
  const [remedy, setRemedy] = useState<Remedy | null>(null);
  const [relatedRemedies, setRelatedRemedies] = useState<Remedy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (signal?: AbortSignal) => {
      if (!slugOrId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await getRemedy(slugOrId, signal);
        setRemedy(data);

        // Fetch related remedies in parallel/after
        const identifier = data._id || slugOrId;
        const related = await getRelatedRemedies(identifier, signal).catch(() => []);
        setRelatedRemedies(related);
      } catch (err: any) {
        if (err?.name === 'AbortError' || signal?.aborted) return;
        setError(err instanceof ApiError ? err.message : 'Remedy not found');
        setRemedy(null);
        setRelatedRemedies([]);
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [slugOrId],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchDetail(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchDetail]);

  return {
    remedy,
    relatedRemedies,
    isLoading,
    error,
    reload: () => fetchDetail(),
  };
}
