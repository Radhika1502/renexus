import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Basic auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  logger.info(`Login attempt for email: ${email}`);
  
  // Mock authentication
  if (email && password) {
    res.json({ 
      success: true,
      message: 'Login successful',
      user: { id: '1', email, name: 'Test User' },
      token: 'mock-jwt-token'
    });
  } else {
    res.status(400).json({ 
      success: false,
      message: 'Email and password required'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  logger.info(`Registration attempt for email: ${email}`);
  
  if (email && password && name) {
    res.json({ 
      success: true,
      message: 'Registration successful',
      user: { id: '2', email, name }
    });
  } else {
    res.status(400).json({ 
      success: false,
      message: 'Email, password, and name required'
    });
  }
});

app.get('/api/auth/me', (req, res) => {
  res.json({ 
    success: true,
    user: { id: '1', email: 'test@example.com', name: 'Test User' }
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Auth Service running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export default app; 