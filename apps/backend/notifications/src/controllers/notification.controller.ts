import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { publishEmailNotification, publishInAppNotification } from "../../shared/config/queue";
import { 
  getUserNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  deleteNotification 
} from '../services/inapp.service';
import { logger } from "../../shared/utils/logger";
import NotificationWebSocketServer from '../websocket';

/**
 * Send email notification
 */
export async function sendEmailNotification(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { to, subject, templateId, templateData, text, html, cc, bcc } = req.body;

    // Either template or direct content must be provided
    if (!templateId && !text && !html) {
      return res.status(400).json({
        error: 'Either templateId or text/html content must be provided'
      });
    }

    const success = await publishEmailNotification({
      to,
      subject,
      templateId,
      templateData,
      text,
      html,
      cc,
      bcc
    });

    if (success) {
      return res.status(202).json({
        message: 'Email notification queued successfully'
      });
    } else {
      return res.status(500).json({
        error: 'Failed to queue email notification'
      });
    }
  } catch (error) {
    logger.error('Error sending email notification', { error });
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}

/**
 * Send in-app notification
 */
export async function sendInAppNotification(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, type, title, message, data, priority, expiresAt } = req.body;

    const success = await publishInAppNotification({
      userId,
      type,
      title,
      message,
      data,
      priority,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    if (success) {
      // Get WebSocket server instance from app
      const wss = (req.app as any).wss as NotificationWebSocketServer;
      
      // Send real-time notification via WebSocket if available
      if (wss) {
        wss.broadcastToUser(userId, {
          type: 'notification',
          data: {
            type,
            title,
            message,
            data,
            priority,
            createdAt: new Date().toISOString()
          }
        });
      }

      return res.status(202).json({
        message: 'In-app notification queued successfully'
      });
    } else {
      return res.status(500).json({
        error: 'Failed to queue in-app notification'
      });
    }
  } catch (error) {
    logger.error('Error sending in-app notification', { error });
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}

/**
 * Get user notifications
 */
export async function getNotifications(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const notifications = await getUserNotifications(userId, page, limit, unreadOnly);

    return res.status(200).json({
      data: notifications,
      pagination: {
        page,
        limit,
        unreadOnly
      }
    });
  } catch (error) {
    logger.error('Error fetching notifications', { error });
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, notificationId } = req.params;

    const success = await markNotificationRead(userId, notificationId);

    if (success) {
      // Get WebSocket server instance from app
      const wss = (req.app as any).wss as NotificationWebSocketServer;
      
      // Send real-time update via WebSocket if available
      if (wss) {
        wss.broadcastToUser(userId, {
          type: 'notification_update',
          data: {
            action: 'read',
            notificationId
          }
        });
      }
      
      return res.status(200).json({
        message: 'Notification marked as read'
      });
    } else {
      return res.status(404).json({
        error: 'Notification not found or already read'
      });
    }
  } catch (error) {
    logger.error('Error marking notification as read', { error });
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;

    const count = await markAllNotificationsRead(userId);

    // Get WebSocket server instance from app
    const wss = (req.app as any).wss as NotificationWebSocketServer;
    
    // Send real-time update via WebSocket if available
    if (wss && count > 0) {
      wss.broadcastToUser(userId, {
        type: 'notification_update',
        data: {
          action: 'read_all',
          count
        }
      });
    }

    return res.status(200).json({
      message: `${count} notifications marked as read`
    });
  } catch (error) {
    logger.error('Error marking all notifications as read', { error });
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}

/**
 * Delete notification
 */
export async function removeNotification(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, notificationId } = req.params;

    const success = await deleteNotification(userId, notificationId);

    if (success) {
      // Get WebSocket server instance from app
      const wss = (req.app as any).wss as NotificationWebSocketServer;
      
      // Send real-time update via WebSocket if available
      if (wss) {
        wss.broadcastToUser(userId, {
          type: 'notification_update',
          data: {
            action: 'delete',
            notificationId
          }
        });
      }
      
      return res.status(200).json({
        message: 'Notification deleted successfully'
      });
    } else {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }
  } catch (error) {
    logger.error('Error deleting notification', { error });
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}

