import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import logger from '../services/logging/logger.service';

// Create Redis client for rate limiting if Redis URL is provided
let redisClient: any = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });
    
    redisClient.on('error', (err: any) => {
      logger.error('Redis client error', { error: err.message });
      // Fall back to memory store if Redis connection fails
      redisClient = null;
    });
    
    redisClient.connect().catch((err: any) => {
      logger.error('Redis connection failed', { error: err.message });
      redisClient = null;
    });
  } catch (error: any) {
    logger.error('Redis client initialization failed', { error: error.message });
    redisClient = null;
  }
}

// Configure rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many requests, please try again later.',
    timestamp: new Date().toISOString()
  },
  // Use Redis store if client is available, otherwise use memory store
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args: any[]) => redisClient.sendCommand(args),
    }),
  }),
  skip: (req: any) => {
    // Skip rate limiting for health check endpoint
    return req.path === '/api/health';
  },
  keyGenerator: (req: any) => {
    // Use IP address as default
    let key = req.ip;
    
    // If user is authenticated, use user ID for more accurate rate limiting
    if (req.user?.id) {
      key = req.user.id;
    }
    
    return key;
  },
});

// More restrictive rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many login attempts, please try again later.',
    timestamp: new Date().toISOString()
  },
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args: any[]) => redisClient.sendCommand(args),
    }),
  }),
});
