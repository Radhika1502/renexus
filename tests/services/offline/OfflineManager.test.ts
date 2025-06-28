import OfflineManager from '../../../services/offline/OfflineManager';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => {
      return Object.keys(store)[index] || null;
    }),
    length: 0
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock navigator.onLine
Object.defineProperty(window.navigator, 'onLine', {
  writable: true,
  value: true
});

describe('OfflineManager', () => {
  let offlineManager: OfflineManager;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Set navigator.onLine to true by default
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true
    });
    
    // Get a fresh instance before each test
    offlineManager = OfflineManager.getInstance();
  });
  
  test('getInstance returns a singleton instance', () => {
    const instance1 = OfflineManager.getInstance();
    const instance2 = OfflineManager.getInstance();
    expect(instance1).toBe(instance2);
  });
  
  test('isOnline returns correct online status', () => {
    // When navigator.onLine is true
    expect(offlineManager.isOnline()).toBe(true);
    
    // When navigator.onLine is false
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false
    });
    expect(offlineManager.isOnline()).toBe(false);
  });
  
  test('storeData saves data to localStorage', () => {
    const key = 'test-key';
    const data = { id: 1, name: 'Test Data' };
    
    offlineManager.storeData(key, data);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      key,
      JSON.stringify(data)
    );
  });
  
  test('getData retrieves data from localStorage', () => {
    const key = 'test-key';
    const data = { id: 1, name: 'Test Data' };
    
    // Store data first
    localStorageMock.setItem(key, JSON.stringify(data));
    
    // Retrieve data
    const retrievedData = offlineManager.getData(key);
    
    expect(localStorageMock.getItem).toHaveBeenCalledWith(key);
    expect(retrievedData).toEqual(data);
  });
  
  test('getData returns null for non-existent key', () => {
    const key = 'non-existent-key';
    
    const retrievedData = offlineManager.getData(key);
    
    expect(localStorageMock.getItem).toHaveBeenCalledWith(key);
    expect(retrievedData).toBeNull();
  });
  
  test('removeData removes data from localStorage', () => {
    const key = 'test-key';
    
    offlineManager.removeData(key);
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);
  });
  
  test('addPendingChange adds a change to the pending changes list', () => {
    const change = {
      id: 'change-1',
      entityType: 'task',
      entityId: 'task-1',
      operation: 'update',
      data: { status: 'in_progress' },
      timestamp: Date.now()
    };
    
    offlineManager.addPendingChange(change);
    
    // Check that the change was stored in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pendingChanges',
      expect.any(String)
    );
    
    // Verify the stored data
    const storedChanges = JSON.parse(localStorageMock.getItem('pendingChanges') || '[]');
    expect(storedChanges).toContainEqual(change);
  });
  
  test('getPendingChanges retrieves all pending changes', () => {
    const changes = [
      {
        id: 'change-1',
        entityType: 'task',
        entityId: 'task-1',
        operation: 'update',
        data: { status: 'in_progress' },
        timestamp: Date.now()
      },
      {
        id: 'change-2',
        entityType: 'task',
        entityId: 'task-2',
        operation: 'create',
        data: { title: 'New Task' },
        timestamp: Date.now()
      }
    ];
    
    // Store changes
    localStorageMock.setItem('pendingChanges', JSON.stringify(changes));
    
    // Retrieve changes
    const retrievedChanges = offlineManager.getPendingChanges();
    
    expect(retrievedChanges).toEqual(changes);
  });
  
  test('removePendingChange removes a specific change', () => {
    const changes = [
      {
        id: 'change-1',
        entityType: 'task',
        entityId: 'task-1',
        operation: 'update',
        data: { status: 'in_progress' },
        timestamp: Date.now()
      },
      {
        id: 'change-2',
        entityType: 'task',
        entityId: 'task-2',
        operation: 'create',
        data: { title: 'New Task' },
        timestamp: Date.now()
      }
    ];
    
    // Store changes
    localStorageMock.setItem('pendingChanges', JSON.stringify(changes));
    
    // Remove one change
    offlineManager.removePendingChange('change-1');
    
    // Verify the remaining changes
    const remainingChanges = JSON.parse(localStorageMock.getItem('pendingChanges') || '[]');
    expect(remainingChanges).toHaveLength(1);
    expect(remainingChanges[0].id).toBe('change-2');
  });
  
  test('clearPendingChanges removes all pending changes', () => {
    const changes = [
      {
        id: 'change-1',
        entityType: 'task',
        entityId: 'task-1',
        operation: 'update',
        data: { status: 'in_progress' },
        timestamp: Date.now()
      },
      {
        id: 'change-2',
        entityType: 'task',
        entityId: 'task-2',
        operation: 'create',
        data: { title: 'New Task' },
        timestamp: Date.now()
      }
    ];
    
    // Store changes
    localStorageMock.setItem('pendingChanges', JSON.stringify(changes));
    
    // Clear all changes
    offlineManager.clearPendingChanges();
    
    // Verify no changes remain
    const remainingChanges = JSON.parse(localStorageMock.getItem('pendingChanges') || '[]');
    expect(remainingChanges).toHaveLength(0);
  });
  
  test('registerConnectionChangeListener adds event listeners', () => {
    // Spy on addEventListener
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    
    // Register a listener
    const listener = jest.fn();
    offlineManager.registerConnectionChangeListener(listener);
    
    // Check that event listeners were added
    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    
    // Clean up
    addEventListenerSpy.mockRestore();
  });
  
  test('unregisterConnectionChangeListener removes event listeners', () => {
    // Spy on removeEventListener
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    // Register and then unregister a listener
    const listener = jest.fn();
    offlineManager.registerConnectionChangeListener(listener);
    offlineManager.unregisterConnectionChangeListener(listener);
    
    // Check that event listeners were removed
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    
    // Clean up
    removeEventListenerSpy.mockRestore();
  });
});
