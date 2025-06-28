import { useState, useEffect, useCallback } from 'react';
import OfflineManager from '../services/offline/OfflineManager';

interface UseOfflineSupportProps {
  entityType?: string;
}

interface UseOfflineSupportResult {
  isOnline: boolean;
  hasPendingChanges: boolean;
  pendingChangesCount: number;
  storeOfflineData: <T>(key: string, data: T) => void;
  getOfflineData: <T>(key: string) => T | null;
  addChange: (entityType: string, operation: 'create' | 'update' | 'delete', data: any) => void;
  syncChanges: () => Promise<boolean>;
  syncInProgress: boolean;
  lastSyncResult: { success: boolean; timestamp: string } | null;
}

/**
 * Hook for managing offline support functionality
 */
export function useOfflineSupport({ entityType }: UseOfflineSupportProps = {}): UseOfflineSupportResult {
  const offlineManager = OfflineManager.getInstance();
  
  const [isOnline, setIsOnline] = useState<boolean>(offlineManager.isDeviceOnline());
  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(offlineManager.hasPendingChanges());
  const [pendingChangesCount, setPendingChangesCount] = useState<number>(offlineManager.getPendingChangesCount());
  const [syncInProgress, setSyncInProgress] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ success: boolean; timestamp: string } | null>(null);
  
  // Store data for offline access
  const storeOfflineData = useCallback(<T>(key: string, data: T): void => {
    offlineManager.storeOfflineData(key, data);
  }, [offlineManager]);
  
  // Get data for offline access
  const getOfflineData = useCallback(<T>(key: string): T | null => {
    return offlineManager.getOfflineData<T>(key);
  }, [offlineManager]);
  
  // Add a change to the pending changes queue
  const addChange = useCallback((entityType: string, operation: 'create' | 'update' | 'delete', data: any): void => {
    offlineManager.addChange(entityType, operation, data);
    setHasPendingChanges(offlineManager.hasPendingChanges());
    setPendingChangesCount(offlineManager.getPendingChangesCount());
  }, [offlineManager]);
  
  // Sync changes with the server
  const syncChanges = useCallback(async (): Promise<boolean> => {
    setSyncInProgress(true);
    const result = await offlineManager.syncChanges();
    setSyncInProgress(false);
    
    setHasPendingChanges(offlineManager.hasPendingChanges());
    setPendingChangesCount(offlineManager.getPendingChangesCount());
    
    setLastSyncResult({
      success: result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  }, [offlineManager]);
  
  // Set up event listeners
  useEffect(() => {
    const handleConnectionChange = (data: { isOnline: boolean }) => {
      setIsOnline(data.isOnline);
    };
    
    const handleSyncStart = () => {
      setSyncInProgress(true);
    };
    
    const handleSyncComplete = (data: { success: boolean }) => {
      setSyncInProgress(false);
      setHasPendingChanges(offlineManager.hasPendingChanges());
      setPendingChangesCount(offlineManager.getPendingChangesCount());
      
      setLastSyncResult({
        success: data.success,
        timestamp: new Date().toISOString()
      });
    };
    
    // Add event listeners
    offlineManager.addEventListener('connectionChange', handleConnectionChange);
    offlineManager.addEventListener('syncStart', handleSyncStart);
    offlineManager.addEventListener('syncComplete', handleSyncComplete);
    
    // Remove event listeners on cleanup
    return () => {
      offlineManager.removeEventListener('connectionChange', handleConnectionChange);
      offlineManager.removeEventListener('syncStart', handleSyncStart);
      offlineManager.removeEventListener('syncComplete', handleSyncComplete);
    };
  }, [offlineManager]);
  
  return {
    isOnline,
    hasPendingChanges,
    pendingChangesCount,
    storeOfflineData,
    getOfflineData,
    addChange,
    syncChanges,
    syncInProgress,
    lastSyncResult
  };
}

export default useOfflineSupport;
