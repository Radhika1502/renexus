import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { OfflineSyncService } from '../services/OfflineSyncService';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<Error | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState<number>(0);
  
  const offlineSyncService = OfflineSyncService.getInstance();
  
  // Initialize online status and add event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncChanges();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check pending changes count on mount
    updatePendingChangesCount();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Update pending changes count
  const updatePendingChangesCount = useCallback(() => {
    const count = offlineSyncService.getPendingChangesCount();
    setPendingChanges(count);
  }, []);
  
  // Sync changes with the backend
  const syncChanges = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    
    try {
      setIsSyncing(true);
      setSyncError(null);
      
      await offlineSyncService.syncChanges();
      
      setLastSyncTime(new Date());
      updatePendingChangesCount();
    } catch (error) {
      console.error('Error syncing changes:', error);
      setSyncError(error instanceof Error ? error : new Error('Unknown sync error'));
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);
  
  // Get cached data for a specific entity type
  const getCachedData = useCallback((entityType: string) => {
    return offlineSyncService.getCachedData(entityType);
  }, []);
  
  // Save data to cache
  const saveToCache = useCallback((entityType: string, data: any) => {
    offlineSyncService.updateCache(entityType, data);
    updatePendingChangesCount();
  }, []);
  
  // Record an offline operation
  const recordOfflineOperation = useCallback((entityType: string, operationType: 'create' | 'update' | 'delete', entityData: any) => {
    offlineSyncService.recordOperation(entityType, operationType, entityData);
    updatePendingChangesCount();
  }, []);
  
  // Clear all cached data and pending operations
  const clearCache = useCallback(async () => {
    await offlineSyncService.clearCache();
    updatePendingChangesCount();
  }, []);
  
  return {
    isOnline,
    isSyncing,
    syncError,
    lastSyncTime,
    pendingChanges,
    syncChanges,
    getCachedData,
    saveToCache,
    recordOfflineOperation,
    clearCache
  };
};
