import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '../api/client';
import { useWebSocket } from './useWebSocket';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationResponse {
  notifications: Notification[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const useNotifications = (page: number = 1, pageSize: number = 20) => {
  const queryClient = useQueryClient();
  const ws = useWebSocket();

  // Subscribe to real-time notifications
  ws.useSubscription('notification:new', (notification: Notification) => {
    queryClient.setQueryData<NotificationResponse>(['notifications', page, pageSize], (old) => {
      if (!old) return old;
      return {
        ...old,
        notifications: [notification, ...old.notifications],
        total: old.total + 1,
      };
    });

    // Update unread count
    queryClient.setQueryData<number>('unreadNotifications', (old) => (old || 0) + 1);
  });

  ws.useSubscription('notification:updated', (notification: Notification) => {
    queryClient.setQueryData<NotificationResponse>(['notifications', page, pageSize], (old) => {
      if (!old) return old;
      return {
        ...old,
        notifications: old.notifications.map((n) =>
          n.id === notification.id ? notification : n
        ),
      };
    });
  });

  ws.useSubscription('notification:all_read', () => {
    queryClient.setQueryData<NotificationResponse>(['notifications', page, pageSize], (old) => {
      if (!old) return old;
      return {
        ...old,
        notifications: old.notifications.map((n) => ({ ...n, isRead: true })),
      };
    });
    queryClient.setQueryData<number>('unreadNotifications', 0);
  });

  const { data, isLoading, error } = useQuery<NotificationResponse>(
    ['notifications', page, pageSize],
    async () => {
      const response = await apiClient.get('/notifications', {
        params: { page, pageSize },
      });
      return response.data;
    }
  );

  const { data: unreadCount } = useQuery<number>('unreadNotifications', async () => {
    const response = await apiClient.get('/notifications/unread/count');
    return response.data.count;
  });

  const markAsRead = useMutation(
    async (notificationId: string) => {
      await apiClient.post(`/notifications/${notificationId}/read`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        queryClient.invalidateQueries('unreadNotifications');
      },
    }
  );

  const markAllAsRead = useMutation(
    async () => {
      await apiClient.post('/notifications/read-all');
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        queryClient.invalidateQueries('unreadNotifications');
      },
    }
  );

  return {
    notifications: data?.notifications || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    unreadCount: unreadCount || 0,
    markAsRead,
    markAllAsRead,
  };
};
