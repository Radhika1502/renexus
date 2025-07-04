import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import { db } from '../../database/db';
import { sql } from 'drizzle-orm';

/**
 * API Optimization Service for Phase 4 Performance Optimization
 * Implements response caching, pagination for large datasets,
 * database query optimization, and efficient batch operations
 */
export class ApiOptimizationService {
  private cache: NodeCache;
  private readonly DEFAULT_CACHE_TTL = 300; // 5 minutes in seconds
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of items in cache
  private readonly DEFAULT_PAGE_SIZE = 25;
  private readonly MAX_PAGE_SIZE = 100;
  private readonly MAX_BATCH_SIZE = 100;
  
  constructor() {
    this.cache = new NodeCache({
      stdTTL: this.DEFAULT_CACHE_TTL,
      checkperiod: 60, // Check for expired keys every 60 seconds
      maxKeys: this.MAX_CACHE_SIZE,
      useClones: false // For better performance
    });
  }
  
  /**
   * Middleware for response caching
   * @param ttl Cache time-to-live in seconds
   */
  cacheMiddleware(ttl: number = this.DEFAULT_CACHE_TTL) {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip caching for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }
      
      // Skip caching for authenticated requests
      if (req.headers.authorization) {
        return next();
      }
      
      // Generate cache key from URL
      const cacheKey = `cache:${req.originalUrl || req.url}`;
      
      // Check if response is in cache
      const cachedResponse = this.cache.get(cacheKey);
      
      if (cachedResponse) {
        // Return cached response
        res.setHeader('X-Cache', 'HIT');
        return res.send(cachedResponse);
      }
      
      // Store original send method
      const originalSend = res.send;
      
      // Override send method to cache response
      res.send = ((body: any) => {
        // Restore original send method
        res.send = originalSend;
        
        // Cache response if status is 200
        if (res.statusCode === 200) {
          this.cache.set(cacheKey, body, ttl);
        }
        
        // Set cache header
        res.setHeader('X-Cache', 'MISS');
        
        // Send response
        return originalSend.call(res, body);
      }) as any;
      
      next();
    };
  }
  
  /**
   * Middleware for pagination
   */
  paginationMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Get pagination parameters from query
      const page = parseInt(req.query.page as string) || 1;
      let pageSize = parseInt(req.query.pageSize as string) || this.DEFAULT_PAGE_SIZE;
      
      // Limit page size
      pageSize = Math.min(pageSize, this.MAX_PAGE_SIZE);
      
      // Add pagination info to request
      req.pagination = {
        page,
        pageSize,
        skip: (page - 1) * pageSize,
        limit: pageSize
      };
      
      next();
    };
  }
  
  /**
   * Clear cache for specific keys or patterns
   */
  clearCache(pattern?: string): {
    success: boolean;
    clearedKeys: number;
    message?: string;
  } {
    try {
      let clearedKeys = 0;
      
      if (pattern) {
        // Get all keys
        const keys = this.cache.keys();
        
        // Filter keys by pattern
        const matchingKeys = keys.filter(key => key.includes(pattern));
        
        // Delete matching keys
        matchingKeys.forEach(key => {
          const deleted = this.cache.del(key);
          if (deleted > 0) {
            clearedKeys += deleted;
          }
        });
      } else {
        // Clear all cache
        clearedKeys = this.cache.flushAll();
      }
      
      return {
        success: true,
        clearedKeys
      };
    } catch (error) {
      console.error('Cache clearing error:', error);
      return { 
        success: false, 
        clearedKeys: 0,
        message: 'Failed to clear cache' 
      };
    }
  }
  
  /**
   * Optimize database query
   */
  optimizeQuery(query: string): {
    success: boolean;
    optimizedQuery?: string;
    message?: string;
  } {
    try {
      // This is a simplified implementation
      // In a real system, this would use query analysis tools
      
      let optimizedQuery = query;
      
      // Add EXPLAIN if not present
      if (!optimizedQuery.toLowerCase().includes('explain')) {
        optimizedQuery = `EXPLAIN ${optimizedQuery}`;
      }
      
      // Suggest indexes for WHERE clauses
      const whereMatches = optimizedQuery.match(/WHERE\s+(\w+)\s*=/gi);
      
      if (whereMatches && whereMatches.length > 0) {
        const suggestions = whereMatches.map(match => {
          const column = match.replace(/WHERE\s+/i, '').replace(/\s*=.*$/i, '');
          return `Consider adding an index on ${column}`;
        });
        
        return {
          success: true,
          optimizedQuery,
          message: `Query optimization suggestions: ${suggestions.join(', ')}`
        };
      }
      
      return {
        success: true,
        optimizedQuery
      };
    } catch (error) {
      console.error('Query optimization error:', error);
      return { 
        success: false, 
        message: 'Failed to optimize query' 
      };
    }
  }
  
  /**
   * Process batch operations efficiently
   */
  async processBatch<T>(
    items: T[],
    processFn: (item: T) => Promise<any>,
    options: {
      batchSize?: number;
      concurrency?: number;
      onProgress?: (processed: number, total: number) => void;
    } = {}
  ): Promise<{
    success: boolean;
    results: any[];
    failedItems: { item: T; error: any }[];
    message?: string;
  }> {
    try {
      const batchSize = options.batchSize || this.MAX_BATCH_SIZE;
      const concurrency = options.concurrency || 5;
      const onProgress = options.onProgress;
      
      const results: any[] = [];
      const failedItems: { item: T; error: any }[] = [];
      
      // Process items in batches
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        // Process batch with limited concurrency
        const batchPromises: Promise<any>[] = [];
        
        for (let j = 0; j < batch.length; j += concurrency) {
          const concurrentBatch = batch.slice(j, j + concurrency);
          
          const concurrentPromises = concurrentBatch.map(async (item) => {
            try {
              const result = await processFn(item);
              results.push(result);
              return { success: true, result };
            } catch (error) {
              failedItems.push({ item, error });
              return { success: false, error };
            }
          });
          
          // Wait for concurrent batch to complete
          const batchResults = await Promise.all(concurrentPromises);
          batchPromises.push(...batchResults);
          
          // Report progress
          if (onProgress) {
            const processed = i + j + concurrentBatch.length;
            onProgress(processed, items.length);
          }
        }
      }
      
      return {
        success: failedItems.length === 0,
        results,
        failedItems,
        message: failedItems.length > 0 
          ? `Completed with ${failedItems.length} failures` 
          : 'Batch processing completed successfully'
      };
    } catch (error) {
      console.error('Batch processing error:', error);
      return { 
        success: false, 
        results: [],
        failedItems: [],
        message: 'Failed to process batch operation' 
      };
    }
  }
  
  /**
   * Generate optimized database queries for common operations
   */
  generateOptimizedQueries(
    table: string,
    fields: string[] = ['*'],
    conditions: Record<string, any> = {}
  ): {
    success: boolean;
    queries?: {
      select: string;
      insert: string;
      update: string;
      delete: string;
    };
    message?: string;
  } {
    try {
      // Build field list
      const fieldList = fields.join(', ');
      
      // Build WHERE clause
      const whereConditions = Object.entries(conditions)
        .map(([key, value]) => {
          if (typeof value === 'string') {
            return `${key} = '${value}'`;
          }
          return `${key} = ${value}`;
        })
        .join(' AND ');
      
      const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';
      
      // Build queries
      const queries = {
        select: `
SELECT ${fieldList}
FROM ${table}
${whereClause}
LIMIT ? OFFSET ?;`,
        
        insert: `
INSERT INTO ${table} (${Object.keys(conditions).join(', ')})
VALUES (${Object.keys(conditions).map(() => '?').join(', ')});`,
        
        update: `
UPDATE ${table}
SET ${Object.keys(conditions).map(key => `${key} = ?`).join(', ')}
${whereClause};`,
        
        delete: `
DELETE FROM ${table}
${whereClause};`
      };
      
      return {
        success: true,
        queries
      };
    } catch (error) {
      console.error('Query generation error:', error);
      return { 
        success: false, 
        message: 'Failed to generate optimized queries' 
      };
    }
  }
  
  /**
   * Analyze API endpoint performance
   */
  async analyzeEndpointPerformance(
    endpoint: string,
    timeframe: 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    success: boolean;
    analysis?: {
      endpoint: string;
      avgResponseTime: number;
      p95ResponseTime: number;
      requestCount: number;
      errorRate: number;
      cacheHitRate: number;
    };
    message?: string;
  }> {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }
      
      // Query API logs
      const logs = await db.execute(sql`
        SELECT 
          response_time,
          status_code,
          cache_hit
        FROM api_logs
        WHERE 
          endpoint = ${endpoint}
          AND timestamp BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
      `);
      
      // Process logs
      const responseTimes = logs.map((log: any) => log.response_time);
      const requestCount = logs.length;
      const errorCount = logs.filter((log: any) => log.status_code >= 400).length;
      const cacheHits = logs.filter((log: any) => log.cache_hit).length;
      
      // Calculate metrics
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / requestCount;
      
      // Calculate p95 response time
      const sortedTimes = [...responseTimes].sort((a, b) => a - b);
      const p95Index = Math.floor(sortedTimes.length * 0.95);
      const p95ResponseTime = sortedTimes[p95Index] || 0;
      
      const errorRate = (errorCount / requestCount) * 100;
      const cacheHitRate = (cacheHits / requestCount) * 100;
      
      return {
        success: true,
        analysis: {
          endpoint,
          avgResponseTime,
          p95ResponseTime,
          requestCount,
          errorRate,
          cacheHitRate
        }
      };
    } catch (error) {
      console.error('Endpoint performance analysis error:', error);
      return { 
        success: false, 
        message: 'Failed to analyze endpoint performance' 
      };
    }
  }
}

// Add pagination type to Express Request
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number;
        pageSize: number;
        skip: number;
        limit: number;
      };
    }
  }
}

export default new ApiOptimizationService();
