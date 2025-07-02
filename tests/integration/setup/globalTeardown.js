/**
 * Global Teardown for Integration Tests
 * Phase 5.1.2 - Integration Testing
 */
const { pool } = require('../../../src/config/database');

module.exports = async function() {
  // Stop MongoDB Memory Server
  if (global.__MONGO_SERVER__) {
    await global.__MONGO_SERVER__.stop();
    console.log('MongoDB Memory Server stopped');
  }

  // Clean up the test database
  try {
    console.log('Cleaning up test database...');
    await pool.query('DROP SCHEMA IF EXISTS test_schema CASCADE');
    await pool.end(); // Close database connections
    console.log('Test database cleanup completed successfully');
  } catch (error) {
    console.error('Failed to clean up test database:', error);
  }

  console.log('Integration test environment teardown completed');
};
