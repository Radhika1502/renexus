/**
 * Setup After Environment for Integration Tests
 * Phase 5.1.2 - Integration Testing
 */
const { pool } = require('../../../src/config/database');
const supertest = require('supertest');
const app = require('../../../src/app');

// Set default timeout for all tests
jest.setTimeout(30000);

// Add global test setup that runs before each test
beforeAll(async () => {
  console.log('Setting up integration test environment');
  
  // Make sure we're using the test schema
  await pool.query('SET search_path TO test_schema');
  
  // Set up global supertest instance
  global.request = supertest(app);
  
  // Start the application server for testing
  const port = process.env.PORT || 9000;
  global.server = app.listen(port, () => {
    console.log(`Test server started on port ${port}`);
  });
});

// Clean up after each test
afterEach(async () => {
  // Clear any in-memory caches or test states that might affect other tests
  jest.clearAllMocks();
  
  // You may want to clean up specific tables between tests
  // For example:
  // await pool.query('TRUNCATE TABLE users, projects, tasks CASCADE');
});

// Global teardown after all tests in a file
afterAll(async () => {
  // Close the test server
  if (global.server) {
    await new Promise(resolve => {
      global.server.close(resolve);
    });
    console.log('Test server closed');
  }
});
