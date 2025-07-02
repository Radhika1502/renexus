import { Injectable, Inject, CACHE_MANAGER } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, { ttl });
  }

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  /**
   * Get cached value or execute function and cache its result
   * @param key Cache key
   * @param fn Function to execute if cache miss
   * @param ttl Time to live in seconds (optional)
   * @returns Cached or computed value
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = await this.get<T>(key);
    
    if (cachedValue !== null && cachedValue !== undefined) {
      return cachedValue;
    }
    
    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  /**
   * Invalidate cache keys by pattern
   * @param pattern Pattern to match keys (e.g., "projects:*")
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    // This is a Redis-specific implementation
    const client = this.cacheManager.store.getClient();
    const keys = await client.keys(pattern);
    
    if (keys.length > 0) {
      await client.del(keys);
    }
  }
}
