/**
 * Test Sequencer for Integration Tests
 * Phase 5.1.2 - Integration Testing
 */
const Sequencer = require('@jest/test-sequencer').default;
const path = require('path');

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Return a new array of tests sorted in the order we want to execute them
    return tests.sort((testA, testB) => {
      const pathA = testA.path;
      const pathB = testB.path;
      
      // Execute authentication tests first
      if (pathA.includes('auth') && !pathB.includes('auth')) {
        return -1;
      }
      if (!pathA.includes('auth') && pathB.includes('auth')) {
        return 1;
      }
      
      // Execute database tests next
      if (pathA.includes('database') && !pathB.includes('database')) {
        return -1;
      }
      if (!pathA.includes('database') && pathB.includes('database')) {
        return 1;
      }
      
      // Execute service tests before API tests
      if (pathA.includes('services') && pathB.includes('api')) {
        return -1;
      }
      if (pathA.includes('api') && pathB.includes('services')) {
        return 1;
      }
      
      // Default to alphabetical sorting
      return pathA.localeCompare(pathB);
    });
  }
}

module.exports = CustomSequencer;
