import { useState, useEffect, useCallback, useRef } from 'react';
import { getTour } from '../api/toursApi';
import type { Tour } from '../types/tour.types';

export function useTour(slug: string, preview = false) {
  const [tour, setTour] = useState<Tour | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchTour = useCallback(async () => {
    if (!slug) {
      setTour(null);
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getTour(slug, preview, controller.signal);
      setTour(data);
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'canceled') return;
      setError(err?.message || 'Tour not found');
      setTour(null);
    } finally {
      setIsLoading(false);
    }
  }, [slug, preview]);

  useEffect(() => {
    fetchTour();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchTour]);

  return {
    tour,
    isLoading,
    error,
    reload: fetchTour,
  };
}
