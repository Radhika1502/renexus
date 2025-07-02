import { EventEmitter } from 'events';

export interface OfflineOperation {
  id: string;
  entityType: string;
  operationType: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface OfflineCache {
  [key: string]: {
    data: any;
    timestamp: number;
  };
}

/**
 * Singleton service for managing offline operations and data synchronization
 */
class OfflineManager extends EventEmitter {
  private static instance: OfflineManager;
  private offlineOperationsKey = 'renexus-offline-operations';
  private offlineCacheKey = 'renexus-offline-cache';
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private apiClient: any = null;
  private syncInterval: number | null = null;
  private maxRetries: number = 5;

  private constructor() {
    super();
    this.setupEventListeners();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  /**
   * Initialize the offline manager with API client
   */
  public initialize(apiClient: any): void {
    this.apiClient = apiClient;
    this.setupAutoSync();
  }

  /**
   * Set up event listeners for online/offline status
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('connectionChange', { isOnline: true });
      this.syncChanges();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('connectionChange', { isOnline: false });
    });
  }

  /**
   * Set up automatic synchronization
   */
  private setupAutoSync(): void {
    // Clear any existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Set up periodic sync attempts (every minute)
    this.syncInterval = window.setInterval(() => {
      if (this.isDeviceOnline() && this.hasPendingChanges()) {
        this.syncChanges();
      }
    }, 60000);
  }

  /**
   * Check if device is online
   */
  public isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Store data for offline access
   */
  public storeOfflineData<T>(key: string, data: T): void {
    try {
      const cache = this.getOfflineCache();
      cache[key] = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.offlineCacheKey, JSON.stringify(cache));
    } catch (error) {
      console.error('Error storing offline data:', error);
    }
  }

  /**
   * Get data for offline access
   */
  public getOfflineData<T>(key: string): T | null {
    try {
      const cache = this.getOfflineCache();
      return cache[key]?.data || null;
    } catch (error) {
      console.error('Error retrieving offline data:', error);
      return null;
    }
  }

  /**
   * Get all cached data
   */
  private getOfflineCache(): OfflineCache {
    try {
      const cache = localStorage.getItem(this.offlineCacheKey);
      return cache ? JSON.parse(cache) : {};
    } catch (error) {
      console.error('Error getting offline cache:', error);
      return {};
    }
  }

  /**
   * Add a change to the pending changes queue
   */
  public addChange(entityType: string, operation: 'create' | 'update' | 'delete', data: any): void {
    try {
      const operations = this.getPendingOperations();
      const newOperation: OfflineOperation = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        entityType,
        operationType: operation,
        data,
        timestamp: Date.now(),
        retryCount: 0
      };

      operations.push(newOperation);
      localStorage.setItem(this.offlineOperationsKey, JSON.stringify(operations));
      
      // Try to sync immediately if we're online
      if (this.isDeviceOnline()) {
        this.syncChanges();
      }
    } catch (error) {
      console.error('Error adding change:', error);
    }
  }

  /**
   * Check if there are pending changes
   */
  public hasPendingChanges(): boolean {
    return this.getPendingChangesCount() > 0;
  }

  /**
   * Get the number of pending changes
   */
  public getPendingChangesCount(): number {
    return this.getPendingOperations().length;
  }

  /**
   * Get all pending operations
   */
  private getPendingOperations(): OfflineOperation[] {
    try {
      const operations = localStorage.getItem(this.offlineOperationsKey);
      return operations ? JSON.parse(operations) : [];
    } catch (error) {
      console.error('Error getting pending operations:', error);
      return [];
    }
  }

  /**
   * Sync changes with the server
   */
  public async syncChanges(): Promise<boolean> {
    if (this.syncInProgress || !this.isDeviceOnline() || !this.apiClient) {
      return false;
    }

    this.syncInProgress = true;
    this.emit('syncStart');
    
    const operations = this.getPendingOperations();
    
    if (operations.length === 0) {
      this.syncInProgress = false;
      this.emit('syncComplete', { success: true });
      return true;
    }

    try {
      const successfulOps: string[] = [];
      const failedOps: OfflineOperation[] = [];

      // Process operations in order
      for (const operation of operations) {
        try {
          await this.processOperation(operation);
          successfulOps.push(operation.id);
        } catch (error) {
          console.error(`Error processing operation ${operation.id}:`, error);
          
          // Increment retry count and keep if under max retries
          if (operation.retryCount < this.maxRetries) {
            operation.retryCount++;
            failedOps.push(operation);
          } else {
            // Log operations that exceeded max retries
            console.error(`Operation ${operation.id} exceeded max retries and will be dropped:`, operation);
            this.emit('operationFailed', { 
              operation, 
              error: error instanceof Error ? error : new Error('Unknown error') 
            });
          }
        }
      }

      // Update operations list with only failed operations
      localStorage.setItem(this.offlineOperationsKey, JSON.stringify(failedOps));
      
      this.syncInProgress = false;
      this.emit('syncComplete', { 
        success: failedOps.length === 0,
        processed: successfulOps.length,
        failed: failedOps.length
      });
      
      return failedOps.length === 0;
    } catch (error) {
      console.error('Error during sync:', error);
      this.syncInProgress = false;
      this.emit('syncComplete', { success: false });
      return false;
    }
  }

  /**
   * Process a single operation
   */
  private async processOperation(operation: OfflineOperation): Promise<void> {
    const { entityType, operationType, data } = operation;
    
    if (!this.apiClient || !this.apiClient[entityType]) {
      throw new Error(`No API client available for entity type: ${entityType}`);
    }

    const client = this.apiClient[entityType];
    
    switch (operationType) {
      case 'create':
        await client.create(data);
        break;
      case 'update':
        await client.update(data.id, data);
        break;
      case 'delete':
        await client.delete(data.id);
        break;
      default:
        throw new Error(`Unknown operation type: ${operationType}`);
    }
  }

  /**
   * Clear all offline data and pending operations
   */
  public clearAll(): void {
    localStorage.removeItem(this.offlineOperationsKey);
    localStorage.removeItem(this.offlineCacheKey);
  }
}

export default OfflineManager;
