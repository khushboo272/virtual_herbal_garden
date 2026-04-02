import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../lib/api';
import type { Plant } from '../lib/types';

interface UsePlantsOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  region?: string;
  tags?: string;
  sort?: string;
}

interface UsePlantsReturn {
  plants: Plant[];
  total: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePlants(options: UsePlantsOptions = {}): UsePlantsReturn {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { page = 1, limit = 12, search, category, region, tags, sort } = options;

  const fetchPlants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ plants: Plant[]; total: number; totalPages: number }>(
        '/plants',
        { page, limit, search, category, region, tags, sort },
      );
      setPlants(res.data.plants || (Array.isArray(res.data) ? res.data as unknown as Plant[] : []));
      setTotal(res.meta?.total ?? res.data.total ?? 0);
      setTotalPages(res.meta?.totalPages ?? res.data.totalPages ?? 0);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load plants';
      setError(msg);
      setPlants([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, category, region, tags, sort]);

  useEffect(() => { fetchPlants(); }, [fetchPlants]);

  return { plants, total, totalPages, isLoading, error, refetch: fetchPlants };
}

export function useFeaturedPlants() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const res = await api.get<Plant[]>('/plants/featured');
        if (!cancelled) setPlants(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load featured plants');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { plants, isLoading, error };
}

export function usePlant(slugOrId: string) {
  const [plant, setPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugOrId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const res = await api.get<Plant>(`/plants/${slugOrId}`);
        if (!cancelled) setPlant(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load plant');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slugOrId]);

  return { plant, isLoading, error };
}

export function usePlantSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ name: string; slug: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.get<Array<{ name: string; slug: string }>>(
          '/plants/search/autocomplete',
          { q: query },
        );
        setSuggestions(Array.isArray(res.data) ? res.data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return { query, setQuery, suggestions, isLoading };
}
