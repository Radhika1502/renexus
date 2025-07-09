import { Task } from '../types';

// Types for offline operations
type OperationType = 'create' | 'update' | 'delete';

interface OfflineOperation {
  id: string;
  type: OperationType;
  entityType: 'task' | 'comment' | 'timeEntry';
  data: any;
  timestamp: number;
}

export class OfflineSyncService {
  private static instance: OfflineSyncService;
  private offlineOperationsKey = 'renexus-offline-operations';
  private offlineDataKey = 'renexus-offline-data';
  private syncInProgress = false;

  private constructor() {
    // Private constructor to enforce singleton
  }

  public static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  // Save task data for offline use
  public saveTasksOffline(tasks: Task[]): void {
    try {
      localStorage.setItem(this.offlineDataKey, JSON.stringify({ tasks, timestamp: Date.now() }));
    } catch (error) {
      console.error('Error saving tasks offline:', error);
    }
  }

  // Get cached tasks when offline
  public getCachedTasks(): Task[] {
    try {
      const cachedData = localStorage.getItem(this.offlineDataKey);
      if (cachedData) {
        const { tasks } = JSON.parse(cachedData);
        return tasks;
      }
    } catch (error) {
      console.error('Error retrieving cached tasks:', error);
    }
    return [];
  }

  // Record an operation that occurred while offline
  public recordOfflineOperation(type: OperationType, entityType: 'task' | 'comment' | 'timeEntry', data: any): void {
    try {
      const operations = this.getPendingOperations();
      const newOperation: OfflineOperation = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        entityType,
        data,
        timestamp: Date.now(),
      };
      
      operations.push(newOperation);
      localStorage.setItem(this.offlineOperationsKey, JSON.stringify(operations));
    } catch (error) {
      console.error('Error recording offline operation:', error);
    }
  }

  // Get all pending operations
  public getPendingOperations(): OfflineOperation[] {
    try {
      const operations = localStorage.getItem(this.offlineOperationsKey);
      return operations ? JSON.parse(operations) : [];
    } catch (error) {
      console.error('Error getting pending operations:', error);
      return [];
    }
  }

  // Sync all pending operations with the server
  public async syncWithServer(apiClient: any): Promise<boolean> {
    if (this.syncInProgress || !navigator.onLine) {
      return false;
    }

    this.syncInProgress = true;
    const operations = this.getPendingOperations();
    
    if (operations.length === 0) {
      this.syncInProgress = false;
      return true;
    }

    try {
      // Process operations in order
      for (const operation of operations) {
        await this.processOperation(operation, apiClient);
      }
      
      // Clear synced operations
      localStorage.setItem(this.offlineOperationsKey, JSON.stringify([]));
      this.syncInProgress = false;
      return true;
    } catch (error) {
      console.error('Error syncing with server:', error);
      this.syncInProgress = false;
      return false;
    }
  }

  // Process a single operation
  private async processOperation(operation: OfflineOperation, apiClient: any): Promise<void> {
    const { type, entityType, data } = operation;
    
    switch (entityType) {
      case 'task':
        if (type === 'create') {
          await apiClient.tasks.create(data);
        } else if (type === 'update') {
          await apiClient.tasks.update(data.id, data);
        } else if (type === 'delete') {
          await apiClient.tasks.delete(data.id);
        }
        break;
        
      case 'comment':
        if (type === 'create') {
          await apiClient.comments.create(data);
        } else if (type === 'update') {
          await apiClient.comments.update(data.id, data);
        } else if (type === 'delete') {
          await apiClient.comments.delete(data.id);
        }
        break;
        
      case 'timeEntry':
        if (type === 'create') {
          await apiClient.timeEntries.create(data);
        } else if (type === 'update') {
          await apiClient.timeEntries.update(data.id, data);
        } else if (type === 'delete') {
          await apiClient.timeEntries.delete(data.id);
        }
        break;
    }
  }

  // Check if we're online and trigger sync if needed
  public setupAutoSync(apiClient: any): void {
    // Sync when coming back online
    window.addEventListener('online', () => {
      this.syncWithServer(apiClient);
    });
    
    // Set up periodic sync attempts
    setInterval(() => {
      if (navigator.onLine) {
        this.syncWithServer(apiClient);
      }
    }, 60000); // Try to sync every minute
  }
}

export const offlineSyncService = OfflineSyncService.getInstance();
