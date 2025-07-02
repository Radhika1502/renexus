/**
 * Notification Types
 * 
 * This file exports notification related types
 */

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: any;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 
  | 'task_assigned'
  | 'task_completed'
  | 'task_due_soon'
  | 'task_overdue'
  | 'comment_added'
  | 'project_update'
  | 'mention'
  | 'system';

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  notificationTypes: {
    [key in NotificationType]?: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  data?: any;
  recipients: string[];
}
