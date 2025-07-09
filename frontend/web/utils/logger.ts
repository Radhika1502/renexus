import winston from 'winston';

/**
 * Custom logger configuration
 * Provides structured logging with different levels and formats
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'renexus-api' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs to combined.log
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console transport in non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

/**
 * Request logger middleware
 * Logs incoming requests with relevant metadata
 */
export const requestLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  // Log when the request completes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.headers['x-request-id'],
      userAgent: req.headers['user-agent'],
      userId: req.user?.id || 'anonymous',
    };
    
    // Log at appropriate level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });
  
  next();
};

/**
 * Log system events
 */
export const systemLogger = {
  startup: (message: string, meta?: any) => {
    logger.info(`STARTUP: ${message}`, meta);
  },
  shutdown: (message: string, meta?: any) => {
    logger.info(`SHUTDOWN: ${message}`, meta);
  },
  config: (message: string, meta?: any) => {
    logger.info(`CONFIG: ${message}`, meta);
  }
};

/**
 * Log database operations
 */
export const dbLogger = {
  query: (message: string, meta?: any) => {
    logger.debug(`DB QUERY: ${message}`, meta);
  },
  error: (message: string, meta?: any) => {
    logger.error(`DB ERROR: ${message}`, meta);
  },
  migration: (message: string, meta?: any) => {
    logger.info(`DB MIGRATION: ${message}`, meta);
  }
};

/**
 * Log security events
 */
export const securityLogger = {
  login: (userId: string, meta?: any) => {
    logger.info(`SECURITY: User login`, { userId, ...meta });
  },
  logout: (userId: string, meta?: any) => {
    logger.info(`SECURITY: User logout`, { userId, ...meta });
  },
  accessDenied: (userId: string, resource: string, meta?: any) => {
    logger.warn(`SECURITY: Access denied`, { userId, resource, ...meta });
  },
  passwordChange: (userId: string, meta?: any) => {
    logger.info(`SECURITY: Password changed`, { userId, ...meta });
  }
};

export default logger;
