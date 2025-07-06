import { logger } from '../logger';
import { Notification } from './notification.service';
import webPush, { PushSubscription as WebPushSubscription } from 'web-push';
import { getDatabaseClient } from '../client';
import { withTransaction } from '../transaction-manager';
import { PushSubscription as DbPushSubscription, NewPushSubscription } from '../schema/push-subscriptions';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushConfig {
  vapidPublicKey: string;
  vapidPrivateKey: string;
  subject: string;
}

export class PushService {
  private client = getDatabaseClient();

  constructor(config: PushConfig) {
    // Configure global VAPID keys for web-push
    webPush.setVapidDetails(
      config.subject,
      config.vapidPublicKey,
      config.vapidPrivateKey
    );
  }

  async sendPushNotification(
    notification: Notification,
    subscription: PushSubscription
  ): Promise<void> {
    try {
      const payload = this.createPushPayload(notification);
      
      await webPush.sendNotification(
        subscription as unknown as WebPushSubscription,
        payload,
        {
          urgency: 'normal',
          topic: notification.type,
          TTL: 24 * 60 * 60, // 24 hours
        }
      );

      // Update last used timestamp
      await this.client.sql`
        UPDATE push_subscriptions
        SET last_used = CURRENT_TIMESTAMP
        WHERE user_id = ${notification.userId}
          AND endpoint = ${subscription.endpoint}
      `;

      logger.info(`Push notification sent successfully to ${subscription.endpoint}`);
    } catch (error: unknown) {
      const err = error as { statusCode?: number };
      if (err?.statusCode === 410) {
        // Subscription has expired or is no longer valid
        await this.removeSubscription(notification.userId, subscription.endpoint);
        logger.info(`Removed expired subscription for user ${notification.userId}`);
      } else {
        logger.error('Failed to send push notification:', error);
        throw error;
      }
    }
  }

  private createPushPayload(notification: Notification): string {
    return JSON.stringify({
      title: notification.title,
      message: notification.message,
      data: notification.data,
      icon: '/icons/notification.png',
      badge: '/icons/badge.png',
      timestamp: notification.createdAt.getTime(),
      tag: notification.id,
      requireInteraction: true,
      actions: this.getPushActions(notification),
    });
  }

  private getPushActions(notification: Notification): Array<{
    action: string;
    title: string;
  }> {
    const actions = [];

    switch (notification.type) {
      case 'task_assigned':
        actions.push(
          { action: 'view', title: 'View Task' },
          { action: 'accept', title: 'Accept' },
          { action: 'decline', title: 'Decline' }
        );
        break;
      case 'task_commented':
        actions.push(
          { action: 'view', title: 'View Comment' },
          { action: 'reply', title: 'Reply' }
        );
        break;
      case 'project_updated':
        actions.push({ action: 'view', title: 'View Project' });
        break;
      case 'mention':
        actions.push(
          { action: 'view', title: 'View' },
          { action: 'reply', title: 'Reply' }
        );
        break;
      default:
        actions.push({ action: 'view', title: 'View' });
    }

    return actions;
  }

  async saveSubscription(
    userId: string,
    subscription: PushSubscription,
    userAgent?: string
  ): Promise<void> {
    return withTransaction(async (context) => {
      // Check if subscription already exists
      const existing = await context.client.sql`
        SELECT id FROM push_subscriptions
        WHERE user_id = ${userId} AND endpoint = ${subscription.endpoint}
      `;

      if (existing.length > 0) {
        // Update existing subscription
        await context.client.sql`
          UPDATE push_subscriptions
          SET
            p256dh = ${subscription.keys.p256dh},
            auth = ${subscription.keys.auth},
            user_agent = ${userAgent || null},
            last_used = CURRENT_TIMESTAMP
          WHERE user_id = ${userId} AND endpoint = ${subscription.endpoint}
        `;
      } else {
        // Create new subscription
        const newSubscription: NewPushSubscription = {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          createdAt: new Date(),
          lastUsed: new Date(),
        };

        await context.client.sql`
          INSERT INTO push_subscriptions ${context.client.sql(newSubscription)}
        `;
      }

      logger.info(`Saved push subscription for user ${userId}`);
    });
  }

  async removeSubscription(
    userId: string,
    endpoint: string
  ): Promise<void> {
    await this.client.sql`
      DELETE FROM push_subscriptions
      WHERE user_id = ${userId} AND endpoint = ${endpoint}
    `;

    logger.info(`Removed push subscription for user ${userId}`);
  }

  async getSubscriptions(userId: string): Promise<PushSubscription[]> {
    const result = await this.client.sql`
      SELECT * FROM push_subscriptions
      WHERE user_id = ${userId}
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `;

    return result.map(row => ({
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth,
      },
    }));
  }

  async cleanupExpiredSubscriptions(): Promise<void> {
    const result = await this.client.sql`
      DELETE FROM push_subscriptions
      WHERE expires_at < CURRENT_TIMESTAMP
        OR last_used < CURRENT_TIMESTAMP - INTERVAL '30 days'
    `;

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired push subscriptions`);
    }
  }
}

let globalService: PushService | undefined;

export const createPushService = (config: PushConfig): PushService => {
  if (!globalService) {
    globalService = new PushService(config);
  }
  return globalService;
};

export const getPushService = (): PushService => {
  if (!globalService) {
    // Default configuration - should be overridden in production
    const config: PushConfig = {
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
      vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
      subject: process.env.VAPID_SUBJECT || 'mailto:support@renexus.com',
    };
    globalService = createPushService(config);
  }
  return globalService;
}; 