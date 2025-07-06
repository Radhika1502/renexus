import { createClient } from 'redis';
import { createLogger } from '../../utils/logger';
import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';

const logger = createLogger('ResponseCache');

interface CacheConfig {
  ttl: number; // Time to live in seconds
  keyPrefix: string;
  excludePaths: string[];
  varyByHeaders: string[];
}

export class ResponseCache {
  private client;
  private connected = false;

  constructor(private config: CacheConfig) {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.setupClient();
  }

  private async setupClient() {
    try {
      await this.client.connect();
      this.connected = true;
      logger.info('Connected to Redis cache');
    } catch (error) {
      logger.error('Failed to connect to Redis', { error });
    }

    this.client.on('error', (error) => {
      logger.error('Redis client error', { error });
      this.connected = false;
    });
  }

  private generateCacheKey(req: Request): string {
    const components = [
      req.method,
      req.path,
      JSON.stringify(req.query),
      // Include relevant headers in cache key
      ...this.config.varyByHeaders.map(header => req.get(header) || ''),
    ];

    if (req.user) {
      components.push(req.user.id);
    }

    return `${this.config.keyPrefix}:${createHash('sha256')
      .update(components.join('|'))
      .digest('hex')}`;
  }

  private shouldCache(req: Request): boolean {
    // Only cache GET requests
    if (req.method !== 'GET') return false;

    // Don't cache excluded paths
    if (this.config.excludePaths.some(path => req.path.startsWith(path))) {
      return false;
    }

    // Don't cache authenticated requests unless specifically allowed
    if (req.user && !req.path.startsWith('/api/public')) {
      return false;
    }

    return true;
  }

  public middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!this.connected || !this.shouldCache(req)) {
        return next();
      }

      const cacheKey = this.generateCacheKey(req);

      try {
        // Try to get from cache
        const cached = await this.client.get(cacheKey);
        if (cached) {
          const { headers, body, status } = JSON.parse(cached);
          
          // Set cached headers
          Object.entries(headers).forEach(([key, value]) => {
            res.setHeader(key, value as string);
          });

          // Add cache header
          res.setHeader('X-Cache', 'HIT');
          
          return res.status(status).json(body);
        }

        // Cache miss - capture the response
        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
          const responseData = {
            headers: res.getHeaders(),
            body,
            status: res.statusCode,
          };

          // Store in cache
          this.client.setEx(
            cacheKey,
            this.config.ttl,
            JSON.stringify(responseData)
          ).catch(error => {
            logger.error('Failed to store in cache', { error, cacheKey });
          });

          res.setHeader('X-Cache', 'MISS');
          return originalJson(body);
        };

        next();
      } catch (error) {
        logger.error('Cache error', { error, cacheKey });
        next();
      }
    };
  }

  public async invalidate(patterns: string[]) {
    if (!this.connected) return;

    try {
      for (const pattern of patterns) {
        const keys = await this.client.keys(`${this.config.keyPrefix}:${pattern}`);
        if (keys.length > 0) {
          await this.client.del(keys);
          logger.info('Cache invalidated', { pattern, keysRemoved: keys.length });
        }
      }
    } catch (error) {
      logger.error('Failed to invalidate cache', { error, patterns });
    }
  }

  public async invalidateAll() {
    if (!this.connected) return;

    try {
      const keys = await this.client.keys(`${this.config.keyPrefix}:*`);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.info('Cache cleared', { keysRemoved: keys.length });
      }
    } catch (error) {
      logger.error('Failed to clear cache', { error });
    }
  }

  public async getStats() {
    if (!this.connected) return null;

    try {
      const info = await this.client.info();
      const dbSize = await this.client.dbSize();
      const memory = await this.client.memory('STATS');

      return {
        totalKeys: dbSize,
        memoryUsage: memory,
        info,
      };
    } catch (error) {
      logger.error('Failed to get cache stats', { error });
      return null;
    }
  }

  public async disconnect() {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }
} 