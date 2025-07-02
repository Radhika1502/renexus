/**
 * Set Environment Variables for Testing
 * 
 * This script sets the necessary environment variables for testing.
 * It can be required at the beginning of test files to ensure proper configuration.
 */

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Database configuration for tests
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'renexus';  // Use the main database name since we're using real data
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';  // Common default PostgreSQL password

// Test-specific settings
process.env.TEST_TENANT_ID = 'test-tenant-1';
process.env.TEST_USER_ID = 'test-user-1';

// Export the environment setup function
module.exports = {
  setupTestEnvironment: () => {
    console.log('Test environment variables set');
    return {
      nodeEnv: process.env.NODE_ENV,
      dbName: process.env.DB_NAME,
      dbUser: process.env.DB_USER
    };
  }
};
