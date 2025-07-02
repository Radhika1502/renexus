/**
 * Jest Global Teardown for Integration Tests
 * 
 * This file will be executed once after all tests complete.
 * Jest global teardown
 * Runs after all tests
 */

const { testDb } = require('./setup/test-db');

module.exports = async () => {
  console.log('\n=== CLEANING UP TEST DATABASE ===\n');
  
  try {
    // Close database connections
    await testDb.close();
    console.log('Test database connections closed.');
  } catch (err) {
    console.error('Error cleaning up test database:', err);
  }
};
