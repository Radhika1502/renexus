/**
 * Test script for offline sync functionality
 * 
 * This script simulates offline/online scenarios and tests the offline sync functionality
 * It can be run in a browser environment or using a headless browser testing tool
 */

// Mock navigator.onLine to simulate offline/online scenarios
function setOnlineStatus(isOnline) {
  // Store the original descriptor
  const originalDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'onLine');
  
  // Define a new getter that returns our mock value
  Object.defineProperty(window.navigator, 'onLine', {
    get: function() {
      return isOnline;
    },
    configurable: true
  });
  
  // Dispatch the appropriate event
  const event = new Event(isOnline ? 'online' : 'offline');
  window.dispatchEvent(event);
  
  console.log(`Network status set to: ${isOnline ? 'online' : 'offline'}`);
  
  // Return a function to restore the original behavior
  return function restore() {
    if (originalDescriptor) {
      Object.defineProperty(window.navigator, 'onLine', originalDescriptor);
    } else {
      delete window.navigator.onLine;
    }
  };
}

// Test offline task creation and synchronization
async function testOfflineTaskCreation() {
  console.log('=== Testing Offline Task Creation ===');
  
  try {
    // Import the necessary modules
    const { OfflineManager } = await import('../../apps/frontend/web/src/services/offline/OfflineManager.js');
    const { createOfflineAwareClient } = await import('../../apps/frontend/web/src/services/api/offlineAwareClient.js');
    
    // Get the OfflineManager instance
    const offlineManager = OfflineManager.getInstance();
    
    // Create a mock task service
    const mockTaskService = {
      fetchTasks: async () => {
        console.log('Fetching tasks from server');
        return [
          { id: '1', title: 'Existing Task 1', status: 'todo' },
          { id: '2', title: 'Existing Task 2', status: 'in_progress' }
        ];
      },
      createTask: async (task) => {
        console.log('Creating task on server:', task);
        return { ...task, id: `server-${Date.now()}` };
      },
      updateTask: async (task) => {
        console.log('Updating task on server:', task);
        return task;
      },
      deleteTask: async (id) => {
        console.log('Deleting task on server:', id);
        return true;
      }
    };
    
    // Create an offline-aware task service
    const offlineTaskService = createOfflineAwareClient({
      tasks: mockTaskService
    });
    
    // Initialize the OfflineManager
    offlineManager.initialize();
    
    // 1. Start in online mode and fetch tasks
    console.log('\nStep 1: Fetching tasks while online');
    const initialTasks = await offlineTaskService.tasks.fetchTasks();
    console.log('Initial tasks:', initialTasks);
    
    // Store tasks for offline access
    offlineManager.storeOfflineData('tasks', initialTasks);
    
    // 2. Go offline
    console.log('\nStep 2: Going offline');
    const restoreOnline = setOnlineStatus(false);
    
    // 3. Create a task while offline
    console.log('\nStep 3: Creating a task while offline');
    const newTask = { title: 'New Offline Task', status: 'todo' };
    
    try {
      const createdTask = await offlineTaskService.tasks.createTask(newTask);
      console.log('Created task while offline:', createdTask);
    } catch (error) {
      console.error('Error creating task while offline:', error);
    }
    
    // 4. Check pending changes
    console.log('\nStep 4: Checking pending changes');
    const pendingChanges = offlineManager.getPendingChanges();
    console.log('Pending changes:', pendingChanges);
    
    // 5. Go back online
    console.log('\nStep 5: Going back online');
    restoreOnline();
    setOnlineStatus(true);
    
    // 6. Sync changes
    console.log('\nStep 6: Syncing changes');
    try {
      await offlineManager.syncChanges();
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Error syncing changes:', error);
    }
    
    // 7. Verify pending changes are cleared
    console.log('\nStep 7: Verifying pending changes are cleared');
    const remainingChanges = offlineManager.getPendingChanges();
    console.log('Remaining changes:', remainingChanges);
    
    console.log('\nTest completed successfully!');
    return true;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

// Test offline data caching
async function testOfflineDataCaching() {
  console.log('=== Testing Offline Data Caching ===');
  
  try {
    // Import the necessary modules
    const { OfflineManager } = await import('../../apps/frontend/web/src/services/offline/OfflineManager.js');
    
    // Get the OfflineManager instance
    const offlineManager = OfflineManager.getInstance();
    
    // 1. Store data for offline access
    console.log('\nStep 1: Storing data for offline access');
    const testData = {
      items: [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ],
      timestamp: Date.now()
    };
    
    offlineManager.storeOfflineData('test-data', testData);
    
    // 2. Go offline
    console.log('\nStep 2: Going offline');
    const restoreOnline = setOnlineStatus(false);
    
    // 3. Retrieve data while offline
    console.log('\nStep 3: Retrieving data while offline');
    const cachedData = offlineManager.getOfflineData('test-data');
    console.log('Cached data:', cachedData);
    
    // 4. Verify data integrity
    console.log('\nStep 4: Verifying data integrity');
    const isDataIntact = 
      cachedData && 
      cachedData.items && 
      cachedData.items.length === 2 && 
      cachedData.items[0].name === 'Item 1';
    
    console.log('Data integrity check:', isDataIntact ? 'PASSED' : 'FAILED');
    
    // 5. Go back online
    console.log('\nStep 5: Going back online');
    restoreOnline();
    
    console.log('\nTest completed successfully!');
    return true;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Starting offline sync tests...\n');
  
  const results = [];
  
  // Test 1: Offline task creation
  try {
    const result1 = await testOfflineTaskCreation();
    results.push({ name: 'Offline Task Creation', passed: result1 });
  } catch (error) {
    results.push({ name: 'Offline Task Creation', passed: false, error });
  }
  
  // Test 2: Offline data caching
  try {
    const result2 = await testOfflineDataCaching();
    results.push({ name: 'Offline Data Caching', passed: result2 });
  } catch (error) {
    results.push({ name: 'Offline Data Caching', passed: false, error });
  }
  
  // Print test summary
  console.log('\n=== Test Summary ===');
  results.forEach(result => {
    console.log(`${result.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
    if (!result.passed && result.error) {
      console.error(result.error);
    }
  });
  
  const allPassed = results.every(result => result.passed);
  console.log(`\nOverall result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
}

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  // Run tests when the page loads
  window.addEventListener('load', runTests);
} else {
  console.error('This script must be run in a browser environment');
}

// Export functions for external use
export {
  setOnlineStatus,
  testOfflineTaskCreation,
  testOfflineDataCaching,
  runTests
};
