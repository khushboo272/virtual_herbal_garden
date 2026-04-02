import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../lib/api';
import type { AdminStats, Plant, User } from '../lib/types';

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<AdminStats>('/admin/stats');
        if (!cancelled) setStats(res.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load stats');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { stats, isLoading, error };
}

export function useAdminPlants() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlants = useCallback(async (page = 1, limit = 20, search?: string) => {
    setIsLoading(true);
    try {
      const res = await api.get<{ plants: Plant[]; total: number }>(
        '/plants',
        { page, limit, search, includeUnpublished: true },
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

  const deletePlant = useCallback(async (plantId: string) => {
    await api.delete(`/plants/${plantId}`);
    setPlants(prev => prev.filter(p => p._id !== plantId));
  }, []);

  const publishPlant = useCallback(async (plantId: string) => {
    await api.post(`/plants/${plantId}/publish`);
    setPlants(prev => prev.map(p => p._id === plantId ? { ...p, isPublished: true } : p));
  }, []);

  return { plants, total, isLoading, error, fetchPlants, deletePlant, publishPlant };
}

export function useAdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async (page = 1, limit = 20, search?: string) => {
    setIsLoading(true);
    try {
      const res = await api.get<{ users: User[]; total: number }>(
        '/admin/users',
        { page, limit, search },
      );
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return { users, total, isLoading, fetchUsers };
}
