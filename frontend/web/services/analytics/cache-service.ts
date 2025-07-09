/**
 * Analytics Caching Service
 * Provides optimized data access with configurable caching strategies for analytics data
 */

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  invalidationStrategy?: 'lru' | 'fifo' | 'lifo';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number; // When the entry was created/updated
  accessCount: number; // How many times the entry has been accessed
  lastAccessed: number; // When the entry was last accessed
}

type CacheKey = string;
type InvalidationPolicy = (key: CacheKey) => boolean;
type InvalidationStrategy = (cache: Map<CacheKey, CacheEntry<any>>) => CacheKey | null;

class AnalyticsCacheService {
  private caches: Map<string, Map<CacheKey, CacheEntry<any>>> = new Map();
  private configs: Map<string, CacheConfig> = new Map();
  private invalidationPolicies: Map<string, InvalidationPolicy[]> = new Map();
  
  /**
   * Initialize a new cache namespace with configuration
   * @param namespace Cache namespace identifier
   * @param config Cache configuration
   */
  public initializeCache(namespace: string, config: CacheConfig): void {
    if (this.caches.has(namespace)) {
      console.warn(`Cache namespace '${namespace}' already exists, overwriting configuration`);
    }
    
    this.caches.set(namespace, new Map());
    this.configs.set(namespace, config);
    this.invalidationPolicies.set(namespace, []);
    
    console.log(`Cache namespace '${namespace}' initialized with TTL: ${config.ttl}ms`);
  }
  
  /**
   * Get data from cache if available, otherwise execute the provider function and cache the result
   * @param namespace Cache namespace
   * @param key Cache key
   * @param provider Function to provide data if not in cache
   * @returns The cached or newly fetched data
   */
  public async getOrSet<T>(namespace: string, key: CacheKey, provider: () => Promise<T>): Promise<T> {
    if (!this.caches.has(namespace)) {
      throw new Error(`Cache namespace '${namespace}' not initialized`);
    }
    
    const cache = this.caches.get(namespace)!;
    const config = this.configs.get(namespace)!;
    
    // Check if key exists in cache and is valid
    if (cache.has(key)) {
      const entry = cache.get(key)!;
      const now = Date.now();
      
      // Check if entry is still valid (not expired)
      if (now - entry.timestamp < config.ttl) {
        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = now;
        
        return entry.data as T;
      }
      
      // Entry expired, remove it
      cache.delete(key);
    }
    
    // Key not in cache or expired, fetch new data
    const data = await provider();
    
    // Check if we need to evict entries before adding new one
    this.enforceMaxSize(namespace);
    
    // Add to cache
    cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    });
    
    return data;
  }
  
  /**
   * Get a value from cache without executing provider function if missing
   * @param namespace Cache namespace
   * @param key Cache key
   * @returns The cached value or null if not found or expired
   */
  public get<T>(namespace: string, key: CacheKey): T | null {
    if (!this.caches.has(namespace)) {
      throw new Error(`Cache namespace '${namespace}' not initialized`);
    }
    
    const cache = this.caches.get(namespace)!;
    const config = this.configs.get(namespace)!;
    
    // Check if key exists and is valid
    if (cache.has(key)) {
      const entry = cache.get(key)!;
      const now = Date.now();
      
      // Check if entry is expired
      if (now - entry.timestamp >= config.ttl) {
        cache.delete(key);
        return null;
      }
      
      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = now;
      
      return entry.data as T;
    }
    
    return null;
  }
  
  /**
   * Set a value in the cache
   * @param namespace Cache namespace
   * @param key Cache key
   * @param value Value to cache
   */
  public set<T>(namespace: string, key: CacheKey, value: T): void {
    if (!this.caches.has(namespace)) {
      throw new Error(`Cache namespace '${namespace}' not initialized`);
    }
    
    const cache = this.caches.get(namespace)!;
    
    // Check if we need to evict entries before adding new one
    this.enforceMaxSize(namespace);
    
    // Update or add cache entry
    cache.set(key, {
      data: value,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now()
    });
  }
  
  /**
   * Add invalidation policy for a cache namespace
   * @param namespace Cache namespace
   * @param policy Function that returns true if a key should be invalidated
   */
  public addInvalidationPolicy(namespace: string, policy: InvalidationPolicy): void {
    if (!this.invalidationPolicies.has(namespace)) {
      throw new Error(`Cache namespace '${namespace}' not initialized`);
    }
    
    this.invalidationPolicies.get(namespace)!.push(policy);
  }
  
  /**
   * Invalidate cache entries based on a specific key prefix
   * @param namespace Cache namespace
   * @param keyPrefix The prefix to match for invalidation
   * @returns Number of entries invalidated
   */
  public invalidateByPrefix(namespace: string, keyPrefix: string): number {
    if (!this.caches.has(namespace)) {
      throw new Error(`Cache namespace '${namespace}' not initialized`);
    }
    
    const cache = this.caches.get(namespace)!;
    let count = 0;
    
    // Find and delete all keys with matching prefix
    for (const key of cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Invalidate cache entries based on a predicate function
   * @param namespace Cache namespace
   * @param predicate Function that returns true for entries to invalidate
   * @returns Number of entries invalidated
   */
  public invalidateByPredicate(namespace: string, predicate: (key: string, entry: CacheEntry<any>) => boolean): number {
    if (!this.caches.has(namespace)) {
      throw new Error(`Cache namespace '${namespace}' not initialized`);
    }
    
    const cache = this.caches.get(namespace)!;
    let count = 0;
    
    // Find and delete all entries that match the predicate
    for (const [key, entry] of cache.entries()) {
      if (predicate(key, entry)) {
        cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Clear an entire cache namespace
   * @param namespace Cache namespace to clear
   */
  public clearCache(namespace: string): void {
    if (!this.caches.has(namespace)) {
      throw new Error(`Cache namespace '${namespace}' not initialized`);
    }
    
    this.caches.get(namespace)!.clear();
    console.log(`Cache namespace '${namespace}' cleared`);
  }
  
  /**
   * Apply all registered invalidation policies for a namespace
   * @param namespace Cache namespace
   * @returns Number of entries invalidated
   */
  public applyInvalidationPolicies(namespace: string): number {
    if (!this.invalidationPolicies.has(namespace)) {
      throw new Error(`Cache namespace '${namespace}' not initialized`);
    }
    
    const cache = this.caches.get(namespace)!;
    const policies = this.invalidationPolicies.get(namespace)!;
    let count = 0;
    
    // Apply each policy to each key
    for (const key of cache.keys()) {
      for (const policy of policies) {
        if (policy(key)) {
          cache.delete(key);
          count++;
          break; // Once invalidated by any policy, move to next key
        }
      }
    }
    
    return count;
  }
  
  /**
   * Enforce maximum cache size by evicting entries if needed
   * @param namespace Cache namespace
   */
  private enforceMaxSize(namespace: string): void {
    const cache = this.caches.get(namespace)!;
    const config = this.configs.get(namespace)!;
    
    if (!config.maxSize || cache.size < config.maxSize) {
      return; // No need to evict anything
    }
    
    // Number of entries to evict
    const evictCount = Math.max(1, Math.ceil(cache.size * 0.1)); // Evict at least 1 or 10% of entries
    
    // Get the appropriate invalidation strategy
    const strategy = this.getInvalidationStrategy(config.invalidationStrategy || 'lru');
    
    // Evict entries
    for (let i = 0; i < evictCount; i++) {
      const keyToEvict = strategy(cache);
      if (keyToEvict) {
        cache.delete(keyToEvict);
      } else {
        break; // No more entries to evict
      }
    }
  }
  
  /**
   * Get invalidation strategy function
   * @param strategyName Name of the invalidation strategy
   * @returns Strategy function
   */
  private getInvalidationStrategy(strategyName: string): InvalidationStrategy {
    switch (strategyName) {
      case 'lru': // Least Recently Used
        return (cache) => {
          let oldestAccessTime = Infinity;
          let oldestKey: CacheKey | null = null;
          
          for (const [key, entry] of cache.entries()) {
            if (entry.lastAccessed < oldestAccessTime) {
              oldestAccessTime = entry.lastAccessed;
              oldestKey = key;
            }
          }
          
          return oldestKey;
        };
        
      case 'fifo': // First In First Out
        return (cache) => {
          let oldestTime = Infinity;
          let oldestKey: CacheKey | null = null;
          
          for (const [key, entry] of cache.entries()) {
            if (entry.timestamp < oldestTime) {
              oldestTime = entry.timestamp;
              oldestKey = key;
            }
          }
          
          return oldestKey;
        };
        
      case 'lifo': // Last In First Out
        return (cache) => {
          let newestTime = 0;
          let newestKey: CacheKey | null = null;
          
          for (const [key, entry] of cache.entries()) {
            if (entry.timestamp > newestTime) {
              newestTime = entry.timestamp;
              newestKey = key;
            }
          }
          
          return newestKey;
        };
        
      default:
        throw new Error(`Unknown invalidation strategy: ${strategyName}`);
    }
  }
  
  /**
   * Get cache statistics for a namespace
   * @param namespace Cache namespace
   * @returns Cache statistics
   */
  public getStats(namespace: string): {
    size: number;
    hitRate?: number;
    avgAge: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    if (!this.caches.has(namespace)) {
      throw new Error(`Cache namespace '${namespace}' not initialized`);
    }
    
    const cache = this.caches.get(namespace)!;
    const now = Date.now();
    
    if (cache.size === 0) {
      return {
        size: 0,
        avgAge: 0,
        oldestEntry: 0,
        newestEntry: 0
      };
    }
    
    let totalAge = 0;
    let oldestTime = now;
    let newestTime = 0;
    
    for (const entry of cache.values()) {
      const age = now - entry.timestamp;
      totalAge += age;
      
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
      }
      
      if (entry.timestamp > newestTime) {
        newestTime = entry.timestamp;
      }
    }
    
    return {
      size: cache.size,
      avgAge: totalAge / cache.size,
      oldestEntry: now - oldestTime,
      newestEntry: now - newestTime
    };
  }
}

// Create singleton instance
const analyticsCacheService = new AnalyticsCacheService();

// Initialize common cache namespaces with default configurations
analyticsCacheService.initializeCache('taskAnalytics', {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 200,
  invalidationStrategy: 'lru'
});

analyticsCacheService.initializeCache('teamPerformance', {
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 100,
  invalidationStrategy: 'lru'
});

analyticsCacheService.initializeCache('dashboards', {
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 50,
  invalidationStrategy: 'lru'
});

analyticsCacheService.initializeCache('reports', {
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 100,
  invalidationStrategy: 'lru'
});

export default analyticsCacheService;
