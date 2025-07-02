import { createClient } from 'redis';
import { logger } from "../../shared/utils/logger";

/**
 * Redis client for notification service
 * Used for storing notifications and pub/sub for WebSocket communication
 */
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

/**
 * Initialize Redis connection
 */
export async function initializeRedis(): Promise<void> {
  try {
    // Set up event handlers
    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    // Connect to Redis
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to initialize Redis', { error });
    throw error;
  }
}

/**
 * Shutdown Redis connection
 */
export async function shutdownRedis(): Promise<void> {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error shutting down Redis', { error });
    // Force disconnect if quit fails
    redisClient.disconnect();
  }
}

