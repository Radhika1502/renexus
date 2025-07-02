import OfflineManager from '../offline/OfflineManager';

/**
 * Creates an offline-aware API client that automatically handles offline operations
 * 
 * @param baseClient The base API client to wrap with offline functionality
 * @returns A new API client with offline support
 */
export function createOfflineAwareClient<T extends Record<string, any>>(baseClient: T): T {
  const offlineManager = OfflineManager.getInstance();
  const wrappedClient: Record<string, any> = {};

  // Initialize the offline manager with the base client
  offlineManager.initialize(baseClient);

  // For each entity type in the base client
  Object.keys(baseClient).forEach(entityType => {
    if (typeof baseClient[entityType] !== 'object') {
      // Copy non-object properties directly
      wrappedClient[entityType] = baseClient[entityType];
      return;
    }

    wrappedClient[entityType] = {};
    const entityClient = baseClient[entityType];

    // Wrap each method in the entity client
    Object.keys(entityClient).forEach(method => {
      if (typeof entityClient[method] !== 'function') {
        // Copy non-function properties directly
        wrappedClient[entityType][method] = entityClient[method];
        return;
      }

      // Special handling for CRUD operations
      if (['create', 'update', 'delete'].includes(method)) {
        wrappedClient[entityType][method] = async (...args: any[]) => {
          try {
            if (!navigator.onLine) {
              // If offline, record the operation for later sync
              offlineManager.addChange(entityType, method as any, args.length > 1 ? { id: args[0], ...args[1] } : args[0]);
              return { success: true, offlineQueued: true };
            }

            // If online, try to perform the operation directly
            const result = await entityClient[method](...args);
            return result;
          } catch (error) {
            // If there's an error (possibly network-related), record for later
            offlineManager.addChange(entityType, method as any, args.length > 1 ? { id: args[0], ...args[1] } : args[0]);
            throw error;
          }
        };
      } else if (method === 'get' || method === 'getAll' || method === 'list' || method === 'find') {
        // For read operations, try to use cached data when offline
        wrappedClient[entityType][method] = async (...args: any[]) => {
          try {
            // Try to get from server first
            if (navigator.onLine) {
              const result = await entityClient[method](...args);
              
              // Cache the result for offline use
              const cacheKey = `${entityType}-${method}-${JSON.stringify(args)}`;
              offlineManager.storeOfflineData(cacheKey, result);
              
              return result;
            }
            
            // If offline, try to get from cache
            const cacheKey = `${entityType}-${method}-${JSON.stringify(args)}`;
            const cachedData = offlineManager.getOfflineData(cacheKey);
            
            if (cachedData) {
              return cachedData;
            }
            
            throw new Error(`No cached data available for ${entityType}.${method} while offline`);
          } catch (error) {
            // Try to get from cache as fallback
            const cacheKey = `${entityType}-${method}-${JSON.stringify(args)}`;
            const cachedData = offlineManager.getOfflineData(cacheKey);
            
            if (cachedData) {
              return {
                ...cachedData,
                fromCache: true,
                cachedAt: new Date().toISOString()
              };
            }
            
            throw error;
          }
        };
      } else {
        // For other methods, just pass through
        wrappedClient[entityType][method] = entityClient[method];
      }
    });
  });

  return wrappedClient as T;
}

export default createOfflineAwareClient;
