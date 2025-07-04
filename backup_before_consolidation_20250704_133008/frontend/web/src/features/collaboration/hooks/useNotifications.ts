import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import { apiClient } from '../../../lib/api/apiClient';
import { Notification } from '../types';
import { useCollaboration } from '../contexts/CollaborationContext';
import { useEffect } from 'react';

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

export const useNotifications = (limit: number = 50) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { subscribeToChannel } = useCollaboration();

  // Fetch notifications
  const { data, isLoading, error } = useQuery<NotificationsResponse>({
    queryKey: ['notifications', user?.id, limit],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const response = await apiClient.get<NotificationsResponse>(
        `/api/notifications?limit=${limit}`
      );
      return response.data;
    },
    enabled: !!user,
  });

  // Subscribe to real-time notification updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToChannel(`notifications-${user.id}`, (message) => {
      // Handle new notification
      if (message.action === 'new') {
        queryClient.setQueryData<NotificationsResponse>(
          ['notifications', user.id, limit],
          (oldData) => {
            if (!oldData) return oldData;
            
            return {
              ...oldData,
              notifications: [message.notification, ...oldData.notifications],
              unreadCount: oldData.unreadCount + 1,
              totalCount: oldData.totalCount + 1,
            };
          }
        );
      }
    });

    return unsubscribe;
  }, [user, subscribeToChannel, queryClient, limit]);

  // Mark notification as read
  const { mutate: markAsRead } = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient.patch(`/api/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData<NotificationsResponse>(
        ['notifications', user?.id, limit],
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            notifications: oldData.notifications.map(n => 
              n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, oldData.unreadCount - 1),
          };
        }
      );
    },
  });

  // Mark notification as unread
  const { mutate: markAsUnread } = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient.patch(`/api/notifications/${notificationId}/unread`);
      return response.data;
    },
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData<NotificationsResponse>(
        ['notifications', user?.id, limit],
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            notifications: oldData.notifications.map(n => 
              n.id === notificationId ? { ...n, read: false } : n
            ),
            unreadCount: oldData.unreadCount + 1,
          };
        }
      );
    },
  });

  // Mark all notifications as read
  const { mutate: markAllAsRead } = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.setQueryData<NotificationsResponse>(
        ['notifications', user?.id, limit],
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            notifications: oldData.notifications.map(n => ({ ...n, read: true })),
            unreadCount: 0,
          };
        }
      );
    },
  });

  // Delete notification
  const { mutate: deleteNotification } = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient.delete(`/api/notifications/${notificationId}`);
      return response.data;
    },
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData<NotificationsResponse>(
        ['notifications', user?.id, limit],
        (oldData) => {
          if (!oldData) return oldData;
          
          const notification = oldData.notifications.find(n => n.id === notificationId);
          const isUnread = notification && !notification.read;
          
          return {
            ...oldData,
            notifications: oldData.notifications.filter(n => n.id !== notificationId),
            unreadCount: isUnread ? Math.max(0, oldData.unreadCount - 1) : oldData.unreadCount,
            totalCount: oldData.totalCount - 1,
          };
        }
      );
    },
  });

  return {
    data: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
  };
};
