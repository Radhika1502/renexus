import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useErrorStore } from './errorStore';

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingOperations: PendingOperation[];
  setOnlineStatus: (status: boolean) => void;
  addPendingOperation: (
    type: PendingOperation['type'],
    entity: string,
    data: any
  ) => void;
  removePendingOperation: (id: string) => void;
  syncPendingOperations: () => Promise<void>;
  clearPendingOperations: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncTime: null,
      pendingOperations: [],

      setOnlineStatus: (status: boolean) => {
        set({ isOnline: status });
        if (status && get().pendingOperations.length > 0) {
          get().syncPendingOperations();
        }
      },

      addPendingOperation: (
        type: PendingOperation['type'],
        entity: string,
        data: any
      ) => {
        const operation: PendingOperation = {
          id: Math.random().toString(36).substring(7),
          type,
          entity,
          data,
          timestamp: Date.now(),
          retryCount: 0,
        };

        set((state) => ({
          pendingOperations: [...state.pendingOperations, operation],
        }));

        // If online, try to sync immediately
        if (get().isOnline) {
          get().syncPendingOperations();
        }
      },

      removePendingOperation: (id: string) => {
        set((state) => ({
          pendingOperations: state.pendingOperations.filter((op) => op.id !== id),
        }));
      },

      syncPendingOperations: async () => {
        const state = get();
        if (state.isSyncing || !state.isOnline || state.pendingOperations.length === 0) {
          return;
        }

        set({ isSyncing: true });

        try {
          const operations = [...state.pendingOperations].sort(
            (a, b) => a.timestamp - b.timestamp
          );

          for (const operation of operations) {
            try {
              // Implement actual API calls here based on operation type and entity
              // For now, we'll just remove the operation
              get().removePendingOperation(operation.id);
            } catch (error) {
              operation.retryCount++;
              if (operation.retryCount >= 3) {
                useErrorStore.getState().addError(
                  `Failed to sync ${operation.entity} after 3 attempts`
                );
                get().removePendingOperation(operation.id);
              }
            }
          }

          set({ lastSyncTime: Date.now() });
        } finally {
          set({ isSyncing: false });
        }
      },

      clearPendingOperations: () => {
        set({ pendingOperations: [] });
      },
    }),
    {
      name: 'sync-storage',
      partialize: (state) => ({
        pendingOperations: state.pendingOperations,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
); 