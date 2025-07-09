import axios from 'axios';
import { Notification, NotificationPreferences } from '../types/notification';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const notificationApi = {
  // Get user notifications
  getNotifications: async (
    page: number = 1,
    pageSize: number = 20,
    filter?: { read?: boolean; type?: string[] }
  ): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> => {
    const response = await axios.get(`${API_BASE_URL}/notifications`, {
      params: {
        page,
        pageSize,
        ...filter,
      },
    });
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    await axios.patch(`${API_BASE_URL}/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    await axios.patch(`${API_BASE_URL}/notifications/read-all`);
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`);
  },

  // Get notification preferences
  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await axios.get(`${API_BASE_URL}/notifications/preferences`);
    return response.data;
  },

  // Update notification preferences
  updatePreferences: async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const response = await axios.patch(`${API_BASE_URL}/notifications/preferences`, preferences);
    return response.data;
  },

  // Subscribe to push notifications
  subscribeToPush: async (subscription: PushSubscriptionJSON): Promise<void> => {
    await axios.post(`${API_BASE_URL}/notifications/push/subscribe`, {
      subscription,
      userAgent: navigator.userAgent,
    });
  },

  // Unsubscribe from push notifications
  unsubscribeFromPush: async (endpoint: string): Promise<void> => {
    await axios.post(`${API_BASE_URL}/notifications/push/unsubscribe`, {
      endpoint,
    });
  },

  // Get push notification public key
  getPushPublicKey: async (): Promise<{ publicKey: string }> => {
    const response = await axios.get(`${API_BASE_URL}/notifications/push/public-key`);
    return response.data;
  },
}; 