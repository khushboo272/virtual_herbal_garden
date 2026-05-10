import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { NotificationType, Notification } from '../lib/types';

export { NotificationType, type Notification };

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get<Notification[]>('/users/me/notifications?limit=50');
      const data = res.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    
    fetchNotifications();

    const socket = getSocket();
    
    // The connection is established in AuthContext, but we listen to events here
    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Show toast
      toast.info(notification.title, {
        description: notification.body,
        action: notification.actionUrl ? {
          label: 'View',
          onClick: () => window.location.href = notification.actionUrl!
        } : undefined
      });
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (ids: string[]) => {
    try {
      await api.patch('/users/me/notifications/mark-read', { ids });
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n._id) ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
      toast.error('Failed to update notifications');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/users/me/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
      toast.error('Failed to update notifications');
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}
