import { useState, useEffect, useCallback } from 'react';
import OfflineManager from '../services/offline/OfflineManager';

interface UseOfflineSyncOptions {
  entityType?: string;
  autoSync?: boolean;
  apiClient?: any;
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
  apiClient
}: UseOfflineSyncOptions = {}): UseOfflineSyncResult {
  const offlineManager = OfflineManager.getInstance();
  
  const [isOnline, setIsOnline] = useState<boolean>(offlineManager.isDeviceOnline());
  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(offlineManager.hasPendingChanges());
  const [pendingChangesCount, setPendingChangesCount] = useState<number>(offlineManager.getPendingChangesCount());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<UseOfflineSyncResult['lastSyncResult']>(null);
  
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
    clearCache
  };
}

export default useOfflineSync;
