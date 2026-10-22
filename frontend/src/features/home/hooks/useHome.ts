import { useState, useEffect, useCallback, useRef } from 'react';
import { getHome } from '../api/homeApi';
import type { HomeData } from '../types/home.types';

interface UseHomeResult {
  data: HomeData | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

export function useHome(): UseHomeResult {
  const [data, setData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Increment to trigger a reload
  const [reloadCount, setReloadCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    getHome(controller.signal)
      .then((payload) => {
        setData(payload);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        const msg = err instanceof Error ? err.message : 'Failed to load home data';
        setError(msg);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [reloadCount]);

  const reload = useCallback(() => {
    setReloadCount((n) => n + 1);
  }, []);

  return { data, isLoading, error, reload };
}
