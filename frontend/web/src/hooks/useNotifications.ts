import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
  data?: Record<string, any>;
}

interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseNotificationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    limit = 20,
    unreadOnly = false
  } = options;
  
  const { user, accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    totalPages: 0
  });

  const fetchNotifications = useCallback(async (page = 1) => {
    if (!user || !accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<NotificationResponse>(
        `/api/notifications/user/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          params: {
            page,
            limit,
            unreadOnly: unreadOnly ? 'true' : 'false'
          }
        }
      );
      
      setNotifications(response.data.notifications || []);
      setPagination(response.data.pagination);
      setUnreadCount(
        (response.data.notifications || []).filter(n => !n.read).length
      );
    } catch (err) {
      console.error('Failed to fetch notifications', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user, accessToken, limit, unreadOnly]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user || !accessToken) return;
    
    try {
      await axios.put(
        `/api/notifications/${notificationId}/read`,
        { userId: user.id },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err) {
      console.error('Failed to mark notification as read', err);
      return false;
    }
  }, [user, accessToken]);

  const markAllAsRead = useCallback(async () => {
    if (!user || !accessToken) return;
    
    try {
      await axios.put(
        `/api/notifications/user/${user.id}/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(n => ({ ...n, read: true }))
      );
      
      setUnreadCount(0);
      
      return true;
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
      return false;
    }
  }, [user, accessToken]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user || !accessToken) return;
    
    try {
      await axios.delete(
        `/api/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          data: { userId: user.id }
        }
      );
      
      // Update local state
      const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;
      
      setNotifications(prevNotifications => 
        prevNotifications.filter(n => n.id !== notificationId)
      );
      
      // Update unread count if needed
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (err) {
      console.error('Failed to delete notification', err);
      return false;
    }
  }, [user, accessToken, notifications]);

  // Load notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      // Reset state when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setPagination({
        page: 1,
        limit,
        total: 0,
        totalPages: 0
      });
    }
  }, [user, fetchNotifications, limit]);

  // Setup polling for new notifications
  useEffect(() => {
    if (!user || !autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchNotifications(pagination.page);
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [user, autoRefresh, refreshInterval, fetchNotifications, pagination.page]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};

export default useNotifications;
