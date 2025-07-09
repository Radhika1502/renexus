import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import { createServer } from 'http';
import { notificationRoutes } from './routes/notification.routes';
import { templateRoutes } from './routes/template.routes';
import { setupMessageQueue } from './config/queue';
import { initializeRedis, shutdownRedis } from './config/redis';
import { logger } from './utils/logger';
import NotificationWebSocketServer from './websocket';

// Load environment variables
dotenv.config();

// Initialize express app
const app: Application = express();
const PORT = process.env.PORT || 4002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Routes
app.use('/notifications', notificationRoutes);
app.use('/templates', templateRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'notification-service',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    status: 'error',
    message
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to message queue
    await setupMessageQueue();
    
    // Initialize Redis
    await initializeRedis();
    
    // Create HTTP server
    const server = createServer(app);
    
    // Initialize WebSocket server
    const wss = new NotificationWebSocketServer(server);
    
    // Store WebSocket server instance on app for access in routes
    (app as any).wss = wss;
    
    server.listen(PORT, () => {
      logger.info(`Notification service running on port ${PORT}`);
      logger.info(`WebSocket server running on ws://localhost:${PORT}/notifications/ws`);
    });
    
    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down notification service...');
      
      // Shutdown components in order
      wss.shutdown();
      await shutdownRedis();
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start notification service', { error });
    process.exit(1);
  }
};

startServer();

export default app;
