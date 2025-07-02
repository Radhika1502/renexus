import { logger } from "../../shared/utils/logger";
import { redisClient } from "../../shared/config/redis";

// In-app notification payload
interface InAppNotification {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  expiresAt?: Date;
}

/**
 * Check if Redis client is connected
 */
async function ensureRedisConnection() {
  if (!redisClient.isOpen) {
    throw new Error('Redis client is not connected');
  }
}

/**
 * Process in-app notification
 * @param notification In-app notification payload
 */
export async function processInAppNotification(notification: InAppNotification): Promise<void> {
  try {
    logger.info('Processing in-app notification', { userId: notification.userId });
    
    await ensureRedisConnection();
    
    // Generate notification ID
    const notificationId = `notification:${Date.now()}:${Math.floor(Math.random() * 10000)}`;
    
    // Create notification object
    const notificationObject = {
      id: notificationId,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      priority: notification.priority || 'normal',
      createdAt: new Date().toISOString(),
      expiresAt: notification.expiresAt ? notification.expiresAt.toISOString() : null,
      read: false
    };
    
    // Store notification in Redis
    await redisClient.hSet(notificationId, notificationObject);
    
    // Add to user's notification list
    const userNotificationsKey = `user:${notification.userId}:notifications`;
    await redisClient.zAdd(userNotificationsKey, {
      score: Date.now(),
      value: notificationId
    });
    
    // If expiration is set, add TTL to the notification
    if (notification.expiresAt) {
      const ttlMs = notification.expiresAt.getTime() - Date.now();
      if (ttlMs > 0) {
        await redisClient.expire(notificationId, Math.floor(ttlMs / 1000));
      }
    }
    
    // Publish notification to Redis channel for real-time updates
    await redisClient.publish('notification-events', JSON.stringify({
      event: 'new_notification',
      userId: notification.userId,
      type: 'notification',
      data: notificationObject
    }));
    
    logger.info('In-app notification processed successfully', { 
      userId: notification.userId,
      notificationId
    });
  } catch (error) {
    logger.error('Failed to process in-app notification', { error, notification });
    throw error;
  }
}

/**
 * Get user notifications
 * @param userId User ID
 * @param page Page number
 * @param limit Items per page
 * @param unreadOnly Get only unread notifications
 */
export async function getUserNotifications(
  userId: string,
  page = 1,
  limit = 20,
  unreadOnly = false
): Promise<any[]> {
  try {
    await ensureRedisConnection();
    
    const userNotificationsKey = `user:${userId}:notifications`;
    
    // Get notification IDs with pagination
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    
    const notificationIds = await redisClient.zRange(userNotificationsKey, start, end, {
      REV: true // Get newest first
    });
    
    if (!notificationIds.length) {
      return [];
    }
    
    // Get notification details
    const notifications = [];
    
    for (const id of notificationIds) {
      const notification = await redisClient.hGetAll(id);
      
      // Skip if notification doesn't exist (might have expired)
      if (!notification || Object.keys(notification).length === 0) {
        continue;
      }
      
      // Parse JSON fields
      if (notification.data) {
        notification.data = JSON.parse(notification.data as string);
      }
      
      // Convert read flag to boolean
      notification.read = notification.read === 'true';
      
      // Filter unread if requested
      if (unreadOnly && notification.read) {
        continue;
      }
      
      notifications.push(notification);
    }
    
    return notifications;
  } catch (error) {
    logger.error('Failed to get user notifications', { error, userId });
    throw error;
  }
}

/**
 * Mark notification as read
 * @param userId User ID
 * @param notificationId Notification ID
 */
export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<boolean> {
  try {
    await ensureRedisConnection();
    
    // Check if notification exists and belongs to user
    const notification = await redisClient.hGetAll(notificationId);
    
    if (!notification || Object.keys(notification).length === 0) {
      return false;
    }
    
    if (notification.userId !== userId) {
      return false;
    }
    
    // Mark as read
    await redisClient.hSet(notificationId, 'read', 'true');
    
    // Publish update to Redis channel
    await redisClient.publish('notifications', JSON.stringify({
      event: 'notification_read',
      userId,
      notificationId
    }));
    
    return true;
  } catch (error) {
    logger.error('Failed to mark notification as read', { error, userId, notificationId });
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 * @param userId User ID
 */
export async function markAllNotificationsRead(userId: string): Promise<number> {
  try {
    await ensureRedisConnection();
    
    const userNotificationsKey = `user:${userId}:notifications`;
    
    // Get all notification IDs
    const notificationIds = await redisClient.zRange(userNotificationsKey, 0, -1);
    
    if (!notificationIds.length) {
      return 0;
    }
    
    let count = 0;
    
    // Mark each notification as read
    for (const id of notificationIds) {
      const notification = await redisClient.hGetAll(id);
      
      if (!notification || Object.keys(notification).length === 0) {
        continue;
      }
      
      if (notification.read === 'false') {
        await redisClient.hSet(id, 'read', 'true');
        count++;
      }
    }
    
    // Publish update to Redis channel
    if (count > 0) {
      await redisClient.publish('notifications', JSON.stringify({
        event: 'all_notifications_read',
        userId,
        count
      }));
    }
    
    return count;
  } catch (error) {
    logger.error('Failed to mark all notifications as read', { error, userId });
    throw error;
  }
}

/**
 * Delete a notification
 * @param userId User ID
 * @param notificationId Notification ID
 */
export async function deleteNotification(
  userId: string,
  notificationId: string
): Promise<boolean> {
  try {
    await ensureRedisConnection();
    
    // Check if notification exists and belongs to user
    const notification = await redisClient.hGetAll(notificationId);
    
    if (!notification || Object.keys(notification).length === 0) {
      return false;
    }
    
    if (notification.userId !== userId) {
      return false;
    }
    
    // Delete notification
    await redisClient.del(notificationId);
    
    // Remove from user's notification list
    const userNotificationsKey = `user:${userId}:notifications`;
    await redisClient.zRem(userNotificationsKey, notificationId);
    
    // Publish update to Redis channel
    await redisClient.publish('notifications', JSON.stringify({
      event: 'notification_deleted',
      userId,
      notificationId
    }));
    
    return true;
  } catch (error) {
    logger.error('Failed to delete notification', { error, userId, notificationId });
    throw error;
  }
}

