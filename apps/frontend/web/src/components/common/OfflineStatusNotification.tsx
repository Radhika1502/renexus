import React from 'react';
import useOfflineSync from '../../hooks/useOfflineSync';

interface OfflineStatusNotificationProps {
  className?: string;
}

/**
 * Component that displays the current offline status and pending sync operations
 */
export const OfflineStatusNotification: React.FC<OfflineStatusNotificationProps> = ({ className = '' }) => {
  const { 
    isOnline, 
    hasPendingChanges, 
    pendingChangesCount, 
    isSyncing, 
    lastSyncResult,
    syncChanges 
  } = useOfflineSync();

  if (isOnline && !hasPendingChanges) {
    return null; // Don't show anything when online with no pending changes
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        {!isOnline && (
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                You're offline
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Changes will be saved locally and synced when you're back online.
              </p>
            </div>
          </div>
        )}
        
        {isOnline && hasPendingChanges && (
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0">
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Pending changes
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {pendingChangesCount} {pendingChangesCount === 1 ? 'change' : 'changes'} waiting to be synced.
              </p>
            </div>
          </div>
        )}
        
        {isSyncing && (
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0">
              <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Syncing changes...
              </p>
            </div>
          </div>
        )}
        
        {lastSyncResult && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Last sync: {new Date(lastSyncResult.timestamp).toLocaleTimeString()} - 
            {lastSyncResult.success ? (
              <span className="text-green-500 ml-1">Success</span>
            ) : (
              <span className="text-red-500 ml-1">Failed</span>
            )}
            {lastSyncResult.processed !== undefined && (
              <span className="ml-1">
                ({lastSyncResult.processed} processed, {lastSyncResult.failed || 0} failed)
              </span>
            )}
          </div>
        )}
        
        {isOnline && hasPendingChanges && !isSyncing && (
          <button
            onClick={() => syncChanges()}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sync now
          </button>
        )}
      </div>
    </div>
  );
};

export default OfflineStatusNotification;
