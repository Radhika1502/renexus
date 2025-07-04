import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { logger } from './utils/logger';
import authRoutes from './routes/auth.routes';
import notificationRoutes from './routes/notification.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// WebSocket proxy for notification service
app.use('/notifications/ws', createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL,
  ws: true,
  changeOrigin: true,
  pathRewrite: { '^/notifications/ws': '/notifications/ws' }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found',
    code: 'NOT_FOUND'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err });
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
});

export default app;
