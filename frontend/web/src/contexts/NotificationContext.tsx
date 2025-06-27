import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useNotificationSocket } from '../hooks/useNotificationSocket';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
  data?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  sendNotification: (notification: {
    userId: string;
    title: string;
    message: string;
    type: string;
    data?: Record<string, any>;
  }) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  refreshInterval?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 20,
  refreshInterval = 30000,
}) => {
  const { user, accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!user || !accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `/api/notifications/user/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          params: {
            limit: maxNotifications,
            unreadOnly: 'false'
          }
        }
      );
      
      setNotifications(response.data.notifications || []);
      setUnreadCount(
        (response.data.notifications || []).filter((n: Notification) => !n.read).length
      );
    } catch (err) {
      console.error('Failed to fetch notifications', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string): Promise<boolean> => {
    if (!user || !accessToken) return false;
    
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
  };

  const markAllAsRead = async (): Promise<boolean> => {
    if (!user || !accessToken) return false;
    
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
  };

  const deleteNotification = async (notificationId: string): Promise<boolean> => {
    if (!user || !accessToken) return false;
    
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
  };

  const sendNotification = async (notification: {
    userId: string;
    title: string;
    message: string;
    type: string;
    data?: Record<string, any>;
  }): Promise<boolean> => {
    if (!accessToken) return false;
    
    try {
      await axios.post(
        '/api/notifications/inapp',
        notification,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      
      // Refresh notifications to include the new one
      await fetchNotifications();
      
      return true;
    } catch (err) {
      console.error('Failed to send notification', err);
      return false;
    }
  };

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Handle WebSocket notifications
  const handleNewNotification = (notification: any) => {
    // Add the new notification to the list
    setNotifications(prev => [notification, ...prev.slice(0, maxNotifications - 1)]);
    setUnreadCount(prev => prev + 1);
  };

  // Handle WebSocket notification updates (read, delete, etc.)
  const handleNotificationUpdate = (update: any) => {
    if (update.action === 'read') {
      // Update a single notification's read status
      setNotifications(prev => 
        prev.map(n => n.id === update.notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } 
    else if (update.action === 'read_all') {
      // Mark all notifications as read
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
    else if (update.action === 'delete') {
      // Remove a notification
      const wasUnread = notifications.find(n => n.id === update.notificationId)?.read === false;
      setNotifications(prev => prev.filter(n => n.id !== update.notificationId));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  // Connect to WebSocket for real-time notifications
  const { isConnected } = useNotificationSocket({
    onNotification: handleNewNotification,
    onNotificationUpdate: handleNotificationUpdate,
    onConnectionChange: (connected) => {
      // Fetch notifications when connection is established
      if (connected) {
        fetchNotifications();
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    }
  });

  // Fallback to polling if WebSocket is not connected
  useEffect(() => {
    if (!user || isConnected) return;
    
    // Only use polling as a fallback when WebSocket is not connected
    const interval = setInterval(() => {
      fetchNotifications();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [user, refreshInterval, isConnected]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
