import express, { Router } from 'express';
import { body, param, query } from 'express-validator';
import { verifyToken } from '../middleware/auth';
import {
  sendEmailNotification,
  sendInAppNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  removeNotification
} from '../controllers/notification.controller';

const router: Router = express.Router();

/**
 * @openapi
 * /notifications/ws:
 *   get:
 *     tags: [Notifications]
 *     summary: WebSocket endpoint for real-time notifications
 *     description: |
 *       Establishes a WebSocket connection for receiving real-time notifications.
 *       Requires a valid JWT token as a query parameter (?token=).
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: JWT authentication token
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID for the notification stream
 *     responses:
 *       101:
 *         description: Switching Protocols (WebSocket connection established)
 */

/**
 * @route POST /notifications/email
 * @desc Send email notification
 * @access Private
 */
router.post(
  '/email',
  verifyToken,
  [
    body('to').isEmail().withMessage('Valid recipient email is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('templateId').optional(),
    body('templateData').optional().isObject(),
    body('text').optional().isString(),
    body('html').optional().isString(),
    body('cc').optional(),
    body('bcc').optional(),
  ],
  sendEmailNotification
);

/**
 * @route POST /notifications/inapp
 * @desc Send in-app notification
 * @access Private
 */
router.post(
  '/inapp',
  verifyToken,
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('type').notEmpty().withMessage('Notification type is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('data').optional().isObject(),
    body('priority').optional().isIn(['low', 'normal', 'high']).withMessage('Priority must be low, normal, or high'),
    body('expiresAt').optional().isISO8601().withMessage('Expiration date must be ISO8601 format')
  ],
  sendInAppNotification
);

/**
 * @route GET /notifications/user/:userId
 * @desc Get user notifications
 * @access Private
 */
router.get(
  '/user/:userId',
  verifyToken,
  [
    param('userId').notEmpty().withMessage('User ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('unreadOnly').optional().isBoolean().withMessage('unreadOnly must be a boolean')
  ],
  getNotifications
);

/**
 * @route PATCH /notifications/user/:userId/:notificationId/read
 * @desc Mark notification as read
 * @access Private
 */
router.patch(
  '/user/:userId/:notificationId/read',
  verifyToken,
  [
    param('userId').notEmpty().withMessage('User ID is required'),
    param('notificationId').notEmpty().withMessage('Notification ID is required')
  ],
  markAsRead
);

/**
 * @route PATCH /notifications/user/:userId/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.patch(
  '/user/:userId/read-all',
  verifyToken,
  [
    param('userId').notEmpty().withMessage('User ID is required')
  ],
  markAllAsRead
);

/**
 * @route DELETE /notifications/user/:userId/:notificationId
 * @desc Delete notification
 * @access Private
 */
router.delete(
  '/user/:userId/:notificationId',
  verifyToken,
  [
    param('userId').notEmpty().withMessage('User ID is required'),
    param('notificationId').notEmpty().withMessage('Notification ID is required')
  ],
  removeNotification
);

export const notificationRoutes: Router = router;
