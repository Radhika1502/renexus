import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { logger } from '../utils/logger';

const router = express.Router();

// Notification service URL
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4002';

// Configure proxy middleware
const notificationProxy = createProxyMiddleware({
  target: notificationServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications': '/notifications', // rewrite path
  },
  logLevel: 'silent',
  onError: (err, req, res) => {
    logger.error('Notification service proxy error', { error: err.message });
    res.status(500).json({
      status: 'error',
      message: 'Notification service unavailable',
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying request to notification service', {
      method: req.method,
      path: req.path,
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info('Received response from notification service', {
      method: req.method,
      path: req.path,
      status: proxyRes.statusCode,
    });
  },
});

// Configure template proxy middleware
const templateProxy = createProxyMiddleware({
  target: notificationServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/notification-templates': '/templates', // rewrite path
  },
  logLevel: 'silent',
  onError: (err, req, res) => {
    logger.error('Notification template service proxy error', { error: err.message });
    res.status(500).json({
      status: 'error',
      message: 'Notification template service unavailable',
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying request to notification template service', {
      method: req.method,
      path: req.path,
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info('Received response from notification template service', {
      method: req.method,
      path: req.path,
      status: proxyRes.statusCode,
    });
  },
});

// Use proxy middleware for notification routes
router.use('/notifications', notificationProxy);
router.use('/notification-templates', templateProxy);

export default router;
