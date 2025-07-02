/**
 * Test Configuration
 * 
 * This module provides configuration variables for test environment
 */

// Database connection settings with fallbacks
module.exports = {
  // Database Settings
  DATABASE: {
    HOST: process.env.TEST_DB_HOST || 'localhost',
    PORT: process.env.TEST_DB_PORT || 5432,
    NAME: process.env.TEST_DB_NAME || 'renexus_test',
    USER: process.env.TEST_DB_USER || 'postgres',
    PASSWORD: process.env.TEST_DB_PASSWORD || 'root', // Default password, should be overridden
    MAX_CONNECTIONS: 5,
    IDLE_TIMEOUT_MS: 10000
  },
  
  // Test Data - reference records to use in tests
  TEST_DATA: {
    TENANT_ID: 'test-tenant-1',
    USER_ID: 'test-user-1',
    PROJECT_ID: 'test-project-1',
    TASK_ID: 'test-task-1'
  },
  
  // API Settings
  API: {
    BASE_URL: process.env.TEST_API_URL || 'http://localhost:3000',
    TIMEOUT_MS: 5000
  }
};
