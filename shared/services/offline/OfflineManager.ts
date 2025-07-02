/**
 * OfflineManager
 * 
 * Service for managing offline data persistence and synchronization
 */
class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = navigator.onLine;
  private pendingChanges: Map<string, any[]> = new Map();
  private syncInProgress: boolean = false;
  private storageKey: string = 'renexus_offline_data';
  private listeners: Map<string, Function[]> = new Map();
  
  private constructor() {
    this.setupEventListeners();
    this.loadPendingChanges();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }
  
  /**
   * Set up event listeners for online/offline events
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners('connectionChange', { isOnline: true });
      this.syncChanges();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners('connectionChange', { isOnline: false });
    });
    
    // Periodically check connection status
    setInterval(() => {
      const currentOnlineStatus = navigator.onLine;
      if (currentOnlineStatus !== this.isOnline) {
        this.isOnline = currentOnlineStatus;
        this.notifyListeners('connectionChange', { isOnline: currentOnlineStatus });
        
        if (currentOnlineStatus) {
          this.syncChanges();
        }
      }
    }, 30000); // Check every 30 seconds
  }
  
  /**
   * Load pending changes from local storage
   */
  private loadPendingChanges(): void {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        Object.keys(parsedData).forEach(key => {
          this.pendingChanges.set(key, parsedData[key]);
        });
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }
  
  /**
   * Save pending changes to local storage
   */
  private savePendingChanges(): void {
    try {
      const dataToStore: Record<string, any[]> = {};
      this.pendingChanges.forEach((changes, key) => {
        dataToStore[key] = changes;
      });
      
      localStorage.setItem(this.storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }
  
  /**
   * Add a change to the pending changes queue
   */
  public addChange(entityType: string, operation: 'create' | 'update' | 'delete', data: any): void {
    if (!this.pendingChanges.has(entityType)) {
      this.pendingChanges.set(entityType, []);
    }
    
    const changes = this.pendingChanges.get(entityType) || [];
    changes.push({
      operation,
      data,
      timestamp: new Date().toISOString()
    });
    
    this.pendingChanges.set(entityType, changes);
    this.savePendingChanges();
    
    // If online, try to sync immediately
    if (this.isOnline) {
      this.syncChanges();
    }
  }
  
  /**
   * Synchronize pending changes with the server
   */
  public async syncChanges(): Promise<boolean> {
    if (this.syncInProgress || !this.isOnline || this.pendingChanges.size === 0) {
      return false;
    }
    
    try {
      this.syncInProgress = true;
      this.notifyListeners('syncStart', {});
      
      // Process each entity type
      for (const [entityType, changes] of this.pendingChanges.entries()) {
        if (changes.length === 0) continue;
        
        // Group changes by operation for batch processing
        const createOperations = changes.filter(c => c.operation === 'create');
        const updateOperations = changes.filter(c => c.operation === 'update');
        const deleteOperations = changes.filter(c => c.operation === 'delete');
        
        // Process create operations
        if (createOperations.length > 0) {
          await this.processBatchOperation(entityType, 'create', createOperations);
        }
        
        // Process update operations
        if (updateOperations.length > 0) {
          await this.processBatchOperation(entityType, 'update', updateOperations);
        }
        
        // Process delete operations
        if (deleteOperations.length > 0) {
          await this.processBatchOperation(entityType, 'delete', deleteOperations);
        }
        
        // Clear processed changes
        this.pendingChanges.delete(entityType);
      }
      
      // Save updated pending changes
      this.savePendingChanges();
      
      this.notifyListeners('syncComplete', { success: true });
      return true;
    } catch (error) {
      console.error('Error syncing changes:', error);
      this.notifyListeners('syncComplete', { success: false, error });
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Process a batch of operations for an entity type
   */
  private async processBatchOperation(entityType: string, operation: string, changes: any[]): Promise<void> {
    // In a real implementation, this would call the API
    // For now, we'll just simulate a successful sync
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Notify about progress
    this.notifyListeners('syncProgress', {
      entityType,
      operation,
      processed: changes.length
    });
  }
  
  /**
   * Store data for offline access
   */
  public storeOfflineData(key: string, data: any): void {
    try {
      localStorage.setItem(`renexus_offline_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error(`Error storing offline data for ${key}:`, error);
    }
  }
  
  /**
   * Retrieve data for offline access
   */
  public getOfflineData<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(`renexus_offline_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error retrieving offline data for ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Check if there are pending changes
   */
  public hasPendingChanges(): boolean {
    return this.pendingChanges.size > 0;
  }
  
  /**
   * Get count of pending changes
   */
  public getPendingChangesCount(): number {
    let count = 0;
    this.pendingChanges.forEach(changes => {
      count += changes.length;
    });
    return count;
  }
  
  /**
   * Check if device is online
   */
  public isDeviceOnline(): boolean {
    return this.isOnline;
  }
  
  /**
   * Add event listener
   */
  public addEventListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.push(callback);
    this.listeners.set(event, eventListeners);
  }
  
  /**
   * Remove event listener
   */
  public removeEventListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) return;
    
    const eventListeners = this.listeners.get(event) || [];
    const updatedListeners = eventListeners.filter(listener => listener !== callback);
    this.listeners.set(event, updatedListeners);
  }
  
  /**
   * Notify listeners of an event
   */
  private notifyListeners(event: string, data: any): void {
    if (!this.listeners.has(event)) return;
    
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }
}

export default OfflineManager;
