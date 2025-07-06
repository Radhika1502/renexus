import { getDatabaseClient } from '../client';
import { withTransaction, TransactionContext } from '../transaction-manager';
import { logger } from '../logger';
import { getDatabaseUtils } from '../db-utils';
import { getEmailService } from '../email-service';
import { getPushService } from '../push-service';

export interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'task_updated' | 'task_commented' | 'project_updated' | 'project_member_added' | 'project_member_removed' | 'mention';
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationCreate {
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  expiresAt?: Date;
}

export interface NotificationFilter {
  userId: string;
  type?: string[];
  read?: boolean;
  search?: string;
  from?: Date;
  to?: Date;
}

export interface NotificationSort {
  field: 'createdAt' | 'readAt';
  direction: 'asc' | 'desc';
}

export interface NotificationPagination {
  page: number;
  pageSize: number;
}

export interface NotificationListResult {
  notifications: Notification[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  unreadCount: number;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  emailFrequency: 'instant' | 'daily' | 'weekly' | 'never';
  notificationTypes: {
    task_assigned: boolean;
    task_updated: boolean;
    task_commented: boolean;
    project_updated: boolean;
    project_member_added: boolean;
    project_member_removed: boolean;
    mention: boolean;
  };
}

export class NotificationService {
  private client = getDatabaseClient();
  private utils = getDatabaseUtils();
  private emailService = getEmailService();
  private pushService = getPushService();

  async createNotification(notification: NotificationCreate): Promise<Notification> {
    logger.info(`Creating notification for user ${notification.userId}`);

    return withTransaction(async (context: TransactionContext) => {
      // Check user preferences
      const preferences = await this.getUserPreferences(notification.userId);
      if (!preferences.inAppEnabled) {
        logger.info(`In-app notifications disabled for user ${notification.userId}`);
        return null;
      }

      if (!preferences.notificationTypes[notification.type]) {
        logger.info(`Notification type ${notification.type} disabled for user ${notification.userId}`);
        return null;
      }

      // Create notification
      const result = await context.client.sql`
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          data,
          read,
          created_at,
          expires_at
        ) VALUES (
          ${notification.userId},
          ${notification.type},
          ${notification.title},
          ${notification.message},
          ${JSON.stringify(notification.data)},
          false,
          CURRENT_TIMESTAMP,
          ${notification.expiresAt || null}
        )
        RETURNING *
      `;

      const newNotification = this.mapToNotification(result[0]);

      // Send email if enabled
      if (preferences.emailEnabled && preferences.emailFrequency === 'instant') {
        await this.sendEmailNotification(newNotification);
      }

      // Send push notification if enabled
      if (preferences.pushEnabled) {
        await this.sendPushNotification(newNotification);
      }

      return newNotification;
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    logger.info(`Marking notification ${notificationId} as read`);

    return withTransaction(async (context: TransactionContext) => {
      const result = await context.client.sql`
        UPDATE notifications
        SET
          read = true,
          read_at = CURRENT_TIMESTAMP
        WHERE id = ${notificationId}
          AND user_id = ${userId}
      `;

      if (result.count === 0) {
        throw new Error(`Notification ${notificationId} not found or not owned by user ${userId}`);
      }
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    logger.info(`Marking all notifications as read for user ${userId}`);

    return withTransaction(async (context: TransactionContext) => {
      await context.client.sql`
        UPDATE notifications
        SET
          read = true,
          read_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
          AND read = false
      `;
    });
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    logger.info(`Deleting notification ${notificationId}`);

    return withTransaction(async (context: TransactionContext) => {
      const result = await context.client.sql`
        DELETE FROM notifications
        WHERE id = ${notificationId}
          AND user_id = ${userId}
      `;

      if (result.count === 0) {
        throw new Error(`Notification ${notificationId} not found or not owned by user ${userId}`);
      }
    });
  }

  async listNotifications(
    filter: NotificationFilter,
    sort: NotificationSort = { field: 'createdAt', direction: 'desc' },
    pagination: NotificationPagination = { page: 1, pageSize: 20 }
  ): Promise<NotificationListResult> {
    // Build base query
    let query = this.client.sql`
      SELECT * FROM notifications
      WHERE user_id = ${filter.userId}
    `;

    // Add filters
    if (filter.type && filter.type.length > 0) {
      query = query.append(this.client.sql` AND type = ANY(${filter.type})`);
    }
    if (filter.read !== undefined) {
      query = query.append(this.client.sql` AND read = ${filter.read}`);
    }
    if (filter.search) {
      query = query.append(this.client.sql`
        AND (
          title ILIKE ${'%' + filter.search + '%'} OR
          message ILIKE ${'%' + filter.search + '%'}
        )
      `);
    }
    if (filter.from) {
      query = query.append(this.client.sql` AND created_at >= ${filter.from}`);
    }
    if (filter.to) {
      query = query.append(this.client.sql` AND created_at <= ${filter.to}`);
    }

    // Add sorting
    query = query.append(this.client.sql` ORDER BY ${this.client.sql(sort.field)} ${this.client.sql(sort.direction)}`);

    // Add pagination
    const offset = (pagination.page - 1) * pagination.pageSize;
    query = query.append(this.client.sql` LIMIT ${pagination.pageSize} OFFSET ${offset}`);

    // Execute query
    const result = await query;
    const notifications = result.map(this.mapToNotification);

    // Get total count and unread count
    const countResult = await this.client.sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE read = false) as unread
      FROM notifications
      WHERE user_id = ${filter.userId}
    `;

    const total = parseInt(countResult[0].total);
    const unreadCount = parseInt(countResult[0].unread);

    return {
      notifications,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
      unreadCount,
    };
  }

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const result = await this.client.sql`
      SELECT * FROM notification_preferences
      WHERE user_id = ${userId}
    `;

    if (result.length === 0) {
      // Create default preferences
      const defaultPreferences: NotificationPreferences = {
        userId,
        emailEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        emailFrequency: 'instant',
        notificationTypes: {
          task_assigned: true,
          task_updated: true,
          task_commented: true,
          project_updated: true,
          project_member_added: true,
          project_member_removed: true,
          mention: true,
        },
      };

      await this.updateUserPreferences(defaultPreferences);
      return defaultPreferences;
    }

    return {
      userId: result[0].user_id,
      emailEnabled: result[0].email_enabled,
      pushEnabled: result[0].push_enabled,
      inAppEnabled: result[0].in_app_enabled,
      emailFrequency: result[0].email_frequency,
      notificationTypes: result[0].notification_types,
    };
  }

  async updateUserPreferences(preferences: NotificationPreferences): Promise<void> {
    logger.info(`Updating notification preferences for user ${preferences.userId}`);

    return withTransaction(async (context: TransactionContext) => {
      await context.client.sql`
        INSERT INTO notification_preferences (
          user_id,
          email_enabled,
          push_enabled,
          in_app_enabled,
          email_frequency,
          notification_types
        ) VALUES (
          ${preferences.userId},
          ${preferences.emailEnabled},
          ${preferences.pushEnabled},
          ${preferences.inAppEnabled},
          ${preferences.emailFrequency},
          ${JSON.stringify(preferences.notificationTypes)}
        )
        ON CONFLICT (user_id) DO UPDATE SET
          email_enabled = EXCLUDED.email_enabled,
          push_enabled = EXCLUDED.push_enabled,
          in_app_enabled = EXCLUDED.in_app_enabled,
          email_frequency = EXCLUDED.email_frequency,
          notification_types = EXCLUDED.notification_types
      `;
    });
  }

  private async sendEmailNotification(notification: Notification): Promise<void> {
    try {
      // Get user email from profile
      const userProfile = await this.client.sql`
        SELECT email FROM user_profiles WHERE user_id = ${notification.userId}
      `;

      if (!userProfile.length || !userProfile[0].email) {
        logger.warn(`No email found for user ${notification.userId}`);
        return;
      }

      await this.emailService.sendEmail(notification, userProfile[0].email);
    } catch (error) {
      logger.error('Failed to send email notification:', error);
      throw error;
    }
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    try {
      // Get user's push subscriptions
      const subscriptions = await this.pushService.getSubscriptions(notification.userId);

      if (subscriptions.length === 0) {
        logger.info(`No push subscriptions found for user ${notification.userId}`);
        return;
      }

      // Send to all subscribed devices
      await Promise.all(
        subscriptions.map(subscription =>
          this.pushService.sendPushNotification(notification, subscription)
        )
      );
    } catch (error) {
      logger.error('Failed to send push notification:', error);
      throw error;
    }
  }

  private mapToNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: row.data,
      read: row.read,
      readAt: row.read_at,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  }
}

let globalService: NotificationService | undefined;

export const getNotificationService = (): NotificationService => {
  if (!globalService) {
    globalService = new NotificationService();
  }
  return globalService;
}; 