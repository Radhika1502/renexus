import { useState, useEffect, useCallback } from 'react';
import OfflineManager from '../services/offline/OfflineManager';
import { useQueryClient } from 'react-query';

interface UseOfflineSyncOptions {
  entityType?: string;
  autoSync?: boolean;
  apiClient?: any;
  onSync?: () => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

interface UseOfflineSyncResult {
  isOnline: boolean;
  hasPendingChanges: boolean;
  pendingChangesCount: number;
  isSyncing: boolean;
  lastSyncResult: {
    success: boolean;
    timestamp: string;
    processed?: number;
    failed?: number;
  } | null;
  storeData: <T>(key: string, data: T) => void;
  getData: <T>(key: string) => T | null;
  addChange: (entityType: string, operation: 'create' | 'update' | 'delete', data: any) => void;
  syncChanges: () => Promise<boolean>;
  clearCache: () => void;
  pendingOperations: PendingOperation[];
  addPendingOperation: (operation: Omit<PendingOperation, 'id' | 'timestamp'>) => void;
  syncPendingOperations: () => Promise<void>;
}

interface PendingOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: string;
  data: any;
  timestamp: number;
}

/**
 * Hook for managing offline operations and synchronization
 * 
 * @param options Configuration options for the hook
 * @returns Methods and state for offline sync management
 */
export function useOfflineSync({
  entityType,
  autoSync = true,
  apiClient,
  onSync,
  onOffline,
  onOnline
}: UseOfflineSyncOptions = {}): UseOfflineSyncResult {
  const offlineManager = OfflineManager.getInstance();
  const queryClient = useQueryClient();
  
  const [isOnline, setIsOnline] = useState<boolean>(offlineManager.isDeviceOnline());
  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(offlineManager.hasPendingChanges());
  const [pendingChangesCount, setPendingChangesCount] = useState<number>(offlineManager.getPendingChangesCount());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<UseOfflineSyncResult['lastSyncResult']>(null);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  
  // Initialize the offline manager with the API client if provided
  useEffect(() => {
    if (apiClient && autoSync) {
      offlineManager.initialize(apiClient);
    }
  }, [apiClient, autoSync]);
  
  // Store data for offline access
  const storeData = useCallback(<T>(key: string, data: T): void => {
    offlineManager.storeOfflineData(key, data);
  }, []);
  
  // Get data for offline access
  const getData = useCallback(<T>(key: string): T | null => {
    return offlineManager.getOfflineData<T>(key);
  }, []);
  
  // Add a change to the pending changes queue
  const addChange = useCallback((entityType: string, operation: 'create' | 'update' | 'delete', data: any): void => {
    offlineManager.addChange(entityType, operation, data);
    setHasPendingChanges(offlineManager.hasPendingChanges());
    setPendingChangesCount(offlineManager.getPendingChangesCount());
  }, []);
  
  // Sync changes with the server
  const syncChanges = useCallback(async (): Promise<boolean> => {
    if (!isOnline) return false;
    
    setIsSyncing(true);
    const result = await offlineManager.syncChanges();
    setIsSyncing(false);
    
    setHasPendingChanges(offlineManager.hasPendingChanges());
    setPendingChangesCount(offlineManager.getPendingChangesCount());
    
    setLastSyncResult({
      success: result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  }, [isOnline]);
  
  // Clear all offline data and pending operations
  const clearCache = useCallback((): void => {
    offlineManager.clearAll();
    setHasPendingChanges(false);
    setPendingChangesCount(0);
  }, []);
  
  // Set up event listeners
  useEffect(() => {
    const handleConnectionChange = (data: { isOnline: boolean }) => {
      setIsOnline(data.isOnline);
    };
    
    const handleSyncStart = () => {
      setIsSyncing(true);
    };
    
    const handleSyncComplete = (data: { 
      success: boolean;
      processed?: number;
      failed?: number;
    }) => {
      setIsSyncing(false);
      setHasPendingChanges(offlineManager.hasPendingChanges());
      setPendingChangesCount(offlineManager.getPendingChangesCount());
      
      setLastSyncResult({
        success: data.success,
        timestamp: new Date().toISOString(),
        processed: data.processed,
        failed: data.failed
      });
    };
    
    // Add event listeners
    offlineManager.on('connectionChange', handleConnectionChange);
    offlineManager.on('syncStart', handleSyncStart);
    offlineManager.on('syncComplete', handleSyncComplete);
    
    // Remove event listeners on cleanup
    return () => {
      offlineManager.removeListener('connectionChange', handleConnectionChange);
      offlineManager.removeListener('syncStart', handleSyncStart);
      offlineManager.removeListener('syncComplete', handleSyncComplete);
    };
  }, []);

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onOnline?.();
      syncPendingOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnline, onOffline]);

  // Add operation to pending queue
  const addPendingOperation = useCallback((operation: Omit<PendingOperation, 'id' | 'timestamp'>) => {
    const newOperation: PendingOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    setPendingOperations(prev => [...prev, newOperation]);
    
    // Store in IndexedDB for persistence
    localStorage.setItem('pendingOperations', JSON.stringify([...pendingOperations, newOperation]));
  }, [pendingOperations]);

  // Sync pending operations when online
  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || isSyncing || pendingOperations.length === 0) return;

    setIsSyncing(true);

    try {
      // Process operations in order
      for (const operation of pendingOperations) {
        try {
          switch (operation.operation) {
            case 'create':
              await fetch(`/api/${operation.entityType}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(operation.data)
              });
              break;

            case 'update':
              await fetch(`/api/${operation.entityType}/${operation.data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(operation.data)
              });
              break;

            case 'delete':
              await fetch(`/api/${operation.entityType}/${operation.data.id}`, {
                method: 'DELETE'
              });
              break;
          }

          // Remove synced operation
          setPendingOperations(prev => prev.filter(op => op.id !== operation.id));
          localStorage.setItem('pendingOperations', JSON.stringify(
            pendingOperations.filter(op => op.id !== operation.id)
          ));

          // Invalidate related queries
          queryClient.invalidateQueries(operation.entityType);

        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          // Keep operation in queue for retry
        }
      }

      onSync?.();
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, pendingOperations, onSync, queryClient]);

  // Load pending operations from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('pendingOperations');
    if (stored) {
      setPendingOperations(JSON.parse(stored));
    }
  }, []);
  
  return {
    isOnline,
    hasPendingChanges,
    pendingChangesCount,
    isSyncing,
    lastSyncResult,
    storeData,
    getData,
    addChange,
    syncChanges,
    clearCache,
    pendingOperations,
    addPendingOperation,
    syncPendingOperations
  };
}

export default useOfflineSync;
