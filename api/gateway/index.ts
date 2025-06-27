import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import { authenticate } from '../../middleware/auth';

// Import routes
import authRoutes from '../routes/auth';
import sessionRoutes from '../routes/auth/session.routes';
import projectRoutes from '../routes/projects';
import taskRoutes from '../routes/tasks';
import templateRoutes from '../routes/templates';
import userRoutes from '../routes/users';

/**
 * API Gateway
 * 
 * Central entry point for all API requests
 * Handles common middleware, security, and routing
 */
export class ApiGateway {
  public app: express.Application;
  
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }
  
  /**
   * Configure middleware for security, logging, and performance
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Session-Token'],
    }));
    
    // Rate limiting to prevent abuse
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);
    
    // Request parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Compression for better performance
    this.app.use(compression());
    
    // Logging
    const logFormat = process.env.NODE_ENV === 'production' 
      ? 'combined' 
      : 'dev';
    this.app.use(morgan(logFormat));
    
    // Request ID tracking
    this.app.use((req, res, next) => {
      const requestId = req.headers['x-request-id'] || crypto.randomUUID();
      req.headers['x-request-id'] = requestId;
      res.setHeader('X-Request-ID', requestId);
      next();
    });
  }
  
  /**
   * Set up API routes
   */
  private setupRoutes(): void {
    // Health check endpoint (no auth required)
    this.app.get('/api/health', (req, res) => {
      res.status(200).json({
        status: 'success',
        message: 'API Gateway is operational',
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || '1.0.0',
      });
    });
    
    // API version endpoint (no auth required)
    this.app.get('/api/version', (req, res) => {
      res.status(200).json({
        version: process.env.API_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      });
    });
    
    // Auth routes (no auth middleware)
    this.app.use('/api/auth', authRoutes);
    
    // Routes that require authentication
    this.app.use('/api/sessions', sessionRoutes);
    this.app.use('/api/projects', authenticate, projectRoutes);
    this.app.use('/api/tasks', authenticate, taskRoutes);
    this.app.use('/api/templates', authenticate, templateRoutes);
    this.app.use('/api/users', authenticate, userRoutes);
    
    // Catch-all for undefined routes
    this.app.all('*', (req, res) => {
      res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
      });
    });
  }
  
  /**
   * Set up global error handling
   */
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', err);
      
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      
      res.status(statusCode).json({
        status: 'error',
        message,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      });
    });
  }
  
  /**
   * Start the API server
   */
  public start(port: number = 3000): void {
    this.app.listen(port, () => {
      console.log(`API Gateway running on port ${port}`);
    });
  }
}

export default new ApiGateway();
