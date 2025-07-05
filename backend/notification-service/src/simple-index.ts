import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 4003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'notification-service',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Basic notification routes
app.post('/api/notifications', (req, res) => {
  const { userId, title, message, type } = req.body;
  
  logger.info(`Creating notification for user: ${userId}`);
  
  if (userId && title && message) {
    res.json({ 
      success: true,
      message: 'Notification created',
      notification: { 
        id: Date.now().toString(), 
        userId, 
        title, 
        message, 
        type: type || 'info',
        createdAt: new Date().toISOString()
      }
    });
  } else {
    res.status(400).json({ 
      success: false,
      message: 'userId, title, and message required'
    });
  }
});

app.get('/api/notifications/:userId', (req, res) => {
  const { userId } = req.params;
  
  logger.info(`Getting notifications for user: ${userId}`);
  
  // Mock notifications
  res.json({ 
    success: true,
    notifications: [
      {
        id: '1',
        userId,
        title: 'Welcome!',
        message: 'Welcome to Renexus',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString()
      }
    ]
  });
});

app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  
  logger.info(`Marking notification ${id} as read`);
  
  res.json({ 
    success: true,
    message: 'Notification marked as read'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Notification Service running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export default app; 