# Offline Sync Documentation

This document provides an overview of the offline synchronization functionality implemented in the Renexus application.

## Overview

The offline sync functionality allows users to continue working with the application even when they are offline. Changes made while offline are queued and synchronized with the server when the connection is restored.

## Key Components

### 1. OfflineManager

`OfflineManager` is a singleton service that manages all offline operations and data caching.

**Location**: `apps/frontend/web/src/services/offline/OfflineManager.ts`

**Key Features**:
- Detects online/offline status
- Manages a queue of pending operations
- Caches data for offline access
- Implements retry logic for failed operations
- Automatically synchronizes when connection is restored
- Emits events for UI components to respond to

**Usage Example**:
```typescript
import OfflineManager from '../services/offline/OfflineManager';

const offlineManager = OfflineManager.getInstance();
offlineManager.initialize(apiClient);

// Add a change to be synchronized later
offlineManager.addChange('tasks', 'update', { id: '123', title: 'Updated Task' });

// Manually trigger synchronization
await offlineManager.syncChanges();

// Store data for offline access
offlineManager.storeOfflineData('recent-tasks', tasks);

// Retrieve cached data
const cachedTasks = offlineManager.getOfflineData('recent-tasks');
```

### 2. useOfflineSync Hook

`useOfflineSync` is a React hook that provides components with offline sync capabilities.

**Location**: `apps/frontend/web/src/hooks/useOfflineSync.ts`

**Key Features**:
- Manages online/offline state
- Tracks pending changes and sync status
- Provides methods for storing and retrieving offline data
- Handles synchronization with the server

**Usage Example**:
```tsx
import { useOfflineSync } from '../hooks/useOfflineSync';

function TaskList() {
  const { 
    isOnline, 
    hasPendingChanges, 
    isSyncing, 
    storeData, 
    getData, 
    addChange, 
    syncChanges 
  } = useOfflineSync();

  // Use offline data if available
  const tasks = getData('tasks') || [];

  const handleUpdateTask = (task) => {
    // If offline, queue the change
    addChange('tasks', 'update', task);
    // Update local UI immediately
  };

  return (
    <div>
      {!isOnline && <div>You are currently offline</div>}
      {hasPendingChanges && isOnline && (
        <button onClick={syncChanges}>Sync Changes</button>
      )}
      {/* Task list rendering */}
    </div>
  );
}
```

### 3. OfflineStatusNotification Component

A UI component that displays the current offline status and pending changes.

**Location**: `apps/frontend/web/src/components/common/OfflineStatusNotification.tsx`

**Features**:
- Shows offline status indicator
- Displays number of pending changes
- Shows sync progress
- Provides a button to manually trigger synchronization

### 4. Offline-Aware API Client

A wrapper for API clients that automatically handles offline operations.

**Location**: `apps/frontend/web/src/services/api/offlineAwareClient.ts`

**Key Features**:
- Automatically queues operations when offline
- Caches read operations for offline access
- Transparently handles synchronization

**Usage Example**:
```typescript
import createOfflineAwareClient from '../services/api/offlineAwareClient';
import * as taskService from '../services/taskService';

// Create an offline-aware client
const offlineTaskClient = createOfflineAwareClient({
  tasks: {
    getAll: taskService.fetchTasks,
    get: taskService.getTaskById,
    create: taskService.createTask,
    update: taskService.updateTask,
    delete: taskService.deleteTask
  }
});

// Use it like a normal client
const tasks = await offlineTaskClient.tasks.getAll();
```

### 5. Project Management Offline Sync

The project management feature now supports offline synchronization.

**Location**: `apps/frontend/web/src/services/projects/offlineProjectService.ts`

**Key Features**:
- Creates, updates, and deletes projects while offline
- Syncs project data when connection is restored
- Handles conflicts during synchronization

**Usage Example**:
```typescript
import { offlineProjectService } from '../services/projects/offlineProjectService';

// Create a project (works online or offline)
const newProject = await offlineProjectService.createProject({
  name: 'New Project',
  description: 'Project description',
  status: 'active',
  startDate: '2025-01-01',
  teamMembers: ['John Doe', 'Jane Smith']
});

// Update a project (works online or offline)
await offlineProjectService.updateProject(projectId, {
  status: 'completed',
  endDate: '2025-12-31'
});

// Delete a project (works online or offline)
await offlineProjectService.deleteProject(projectId);
```

## Implementation Details

### Data Storage

Offline data is stored in the browser's localStorage with the following structure:

- `offlineData`: Cached data for offline access
- `pendingChanges`: Queue of operations to be synchronized
- `syncStatus`: Information about the last synchronization attempt

### Synchronization Process

1. When a user performs an operation while offline, it is added to the pending changes queue
2. When the connection is restored, the OfflineManager automatically attempts to synchronize
3. Each operation is processed in order with retry logic
4. If an operation fails after maximum retries, it remains in the queue
5. The UI is updated with synchronization status and results

### Error Handling

- Network errors trigger the offline mode
- Failed operations are retried with exponential backoff
- Maximum retry count prevents infinite retry loops
- Detailed error information is logged for debugging

## Best Practices

1. **Always use the offline-aware client** for API operations that should work offline
2. **Cache necessary data** for offline access using `storeData`
3. **Update the UI immediately** when operations are performed offline
4. **Handle conflicts** that may occur during synchronization
5. **Test thoroughly** with various network conditions

## Future Enhancements

- Conflict resolution strategies for concurrent changes
- Compression of cached data to reduce storage usage
- Selective synchronization of high-priority changes
- Background synchronization using service workers
- End-to-end encryption of cached data
