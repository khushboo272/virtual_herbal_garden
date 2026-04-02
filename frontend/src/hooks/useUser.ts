import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../lib/api';
import type { Bookmark, Notification } from '../lib/types';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ bookmarks: Bookmark[] }>('/users/me/bookmarks');
      setBookmarks(res.data.bookmarks || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load bookmarks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  const addBookmark = useCallback(async (plantId: string) => {
    try {
      await api.post('/users/me/bookmarks', { plantId });
      await fetchBookmarks();
    } catch (err) {
      throw err instanceof ApiError ? err : new Error('Failed to add bookmark');
    }
  }, [fetchBookmarks]);

  const removeBookmark = useCallback(async (bookmarkId: string) => {
    try {
      await api.delete(`/users/me/bookmarks/${bookmarkId}`);
      setBookmarks(prev => prev.filter(b => b._id !== bookmarkId));
    } catch (err) {
      throw err instanceof ApiError ? err : new Error('Failed to remove bookmark');
    }
  }, []);

  return { bookmarks, isLoading, error, addBookmark, removeBookmark, refetch: fetchBookmarks };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ notifications: Notification[] }>('/users/me/notifications');
      const items = res.data.notifications || [];
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.isRead).length);
    } catch {
      // Silently fail for notifications
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await api.patch(`/users/me/notifications/${notificationId}`, { isRead: true });
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  }, []);

  return { notifications, unreadCount, isLoading, markAsRead, refetch: fetchNotifications };
}

export function useUserProfile() {
  const [stats, setStats] = useState<{
    plantsExplored: number;
    toursCompleted: number;
    learningHours: number;
    detections: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<typeof stats>('/users/me/stats');
        if (!cancelled) setStats(res.data);
      } catch {
        // Use defaults
        if (!cancelled) setStats({ plantsExplored: 0, toursCompleted: 0, learningHours: 0, detections: 0 });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { stats, isLoading };
}
