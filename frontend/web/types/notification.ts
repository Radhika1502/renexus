export interface Notification {
  id: string;
  userId: string;
  type: 'task' | 'project' | 'comment' | 'mention';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskReminders: boolean;
  systemUpdates: boolean;
} 