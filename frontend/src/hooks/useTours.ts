import { useState, useEffect } from 'react';
import { api, ApiError } from '../lib/api';
import type { Tour } from '../lib/types';

export function useTours() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const res = await api.get<{ tours: Tour[] }>('/tours');
        if (!cancelled) setTours(res.data.tours || (Array.isArray(res.data) ? res.data as unknown as Tour[] : []));
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load tours');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { tours, isLoading, error };
}

export function useTour(slug: string) {
  const [tour, setTour] = useState<Tour | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const res = await api.get<Tour>(`/tours/${slug}`);
        if (!cancelled) setTour(res.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load tour');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  return { tour, isLoading, error };
}
