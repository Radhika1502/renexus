import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useNotificationSocket, NotificationData, NotificationUpdate } from '../hooks/useNotificationSocket';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  sendNotification: (notification: {
    userId: string;
    title: string;
    message: string;
    type: NotificationData['type'];
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
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotifications = async () => {
    if (!user || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<{ notifications: NotificationData[] }>(
        `/api/notifications/user/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            limit: maxNotifications,
            unreadOnly: 'false'
          }
        }
      );
      
      setNotifications(response.data.notifications || []);
      setUnreadCount(
        (response.data.notifications || []).filter(n => !n.read).length
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load notifications');
      console.error('Failed to fetch notifications:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string): Promise<boolean> => {
    if (!user || !token) return false;
    
    try {
      await axios.put(
        `/api/notifications/${notificationId}/read`,
        { userId: user.id },
        {
          headers: {
            Authorization: `Bearer ${token}`
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
      const error = err instanceof Error ? err : new Error('Failed to mark notification as read');
      console.error('Failed to mark notification as read:', error);
      setError(error);
      return false;
    }
  };

  const markAllAsRead = async (): Promise<boolean> => {
    if (!user || !token) return false;
    
    try {
      await axios.put(
        `/api/notifications/user/${user.id}/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
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
      const error = err instanceof Error ? err : new Error('Failed to mark all notifications as read');
      console.error('Failed to mark all notifications as read:', error);
      setError(error);
      return false;
    }
  };

  const deleteNotification = async (notificationId: string): Promise<boolean> => {
    if (!user || !token) return false;
    
    try {
      await axios.delete(
        `/api/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
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
      const error = err instanceof Error ? err : new Error('Failed to delete notification');
      console.error('Failed to delete notification:', error);
      setError(error);
      return false;
    }
  };

  const sendNotification = async (notification: {
    userId: string;
    title: string;
    message: string;
    type: NotificationData['type'];
    data?: Record<string, any>;
  }): Promise<boolean> => {
    if (!token) return false;
    
    try {
      await axios.post(
        '/api/notifications/inapp',
        notification,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // The notification will come back through the WebSocket
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send notification');
      console.error('Failed to send notification:', error);
      setError(error);
      return false;
    }
  };

  // Handle new notifications from WebSocket
  const handleNewNotification = (notification: NotificationData) => {
    setNotifications(prev => {
      // Check if we already have this notification
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;

      // Add the new notification at the start and maintain the limit
      const updated = [notification, ...prev].slice(0, maxNotifications);
      
      // Update unread count if needed
      if (!notification.read) {
        setUnreadCount(count => count + 1);
      }
      
      return updated;
    });
  };

  // Handle notification updates from WebSocket
  const handleNotificationUpdate = (update: NotificationUpdate) => {
    setNotifications(prev => 
      prev.map(n => {
        if (n.id !== update.id) return n;
        
        // If the update changes the read status, update the unread count
        if ('read' in update.changes && update.changes.read !== n.read) {
          setUnreadCount(count => 
            update.changes.read ? Math.max(0, count - 1) : count + 1
          );
        }
        
        return { ...n, ...update.changes };
      })
    );
  };

  // Setup WebSocket connection
  useNotificationSocket({
    onNotification: handleNewNotification,
    onNotificationUpdate: handleNotificationUpdate,
    onError: (err) => {
      console.error('Notification socket error:', err);
      setError(err);
    }
  });

  // Fetch notifications periodically
  useEffect(() => {
    if (!user || !token) return;

    // Initial fetch
    fetchNotifications();

    // Setup periodic refresh
    const intervalId = setInterval(fetchNotifications, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [user, token, refreshInterval]);

  const value: NotificationContextType = {
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
