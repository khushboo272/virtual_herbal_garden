// ──────────────────────────────────────────────────────────
// useDashboard — hook to fetch role-specific dashboard data
// PRD §7.1
// ──────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

/** User dashboard summary (PRD §4.2.2) */
export interface UserDashboardSummary {
  stats: {
    bookmarks: number;
    gardenPlants: number;
    aiScans: number;
    streak: number;
  };
  recentActivity: Array<{
    _id: string;
    activityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
  }>;
  recentBookmarks: Array<{
    _id: string;
    entityType: string;
    entityId: unknown;
    createdAt: string;
  }>;
}

/** Admin dashboard summary (PRD §4.4.2) */
export interface AdminDashboardSummary {
  stats: {
    totalUsers: number;
    activeToday: number;
    publishedPlants: number;
    aiScansToday: number;
    pendingReview: number;
    toursPublished: number;
  };
  deltas: {
    newUsersThisWeek: number;
    newPlantsThisWeek: number;
  };
  pendingByType: {
    plants: number;
    remedies: number;
    tours: number;
  };
}

export function useUserDashboard() {
  const [data, setData] = useState<UserDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<UserDashboardSummary>('/users/me/dashboard-summary');
      setData(res.data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { data, isLoading, error, refresh: fetchSummary };
}

export function useAdminDashboard() {
  const [data, setData] = useState<AdminDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<AdminDashboardSummary>('/admin/dashboard-summary');
      setData(res.data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { data, isLoading, error, refresh: fetchSummary };
}
