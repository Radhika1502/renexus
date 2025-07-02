/**
 * Jest Global Setup for Integration Tests
 * 
 * This file will be executed once before all the tests run.
 * It sets up the test database with proper schema and seed data.
 */

const { setupTestDatabase } = require('./setup/test-db');

module.exports = async () => {
  console.log('\n=== SETTING UP TEST DATABASE ===\n');
  console.log('Setting up test database with hybrid approach...');
  
  try {
    // Make sure we're using test environment
    process.env.NODE_ENV = 'test';
    
    // Set up test database - will try real connection first, fall back to mocks if needed
    const db = await setupTestDatabase();
    
    if (db.isUsingRealDb) {
      console.log('Test database setup complete with real database connection.');
    } else {
      console.log('Using mock data for tests as real database connection failed.');
    }
  } catch (err) {
    console.error('Error setting up test database:', err);
    console.error('Using mock data for tests as fallback.');
  }
  
  console.log('\n=== TEST DATABASE SETUP COMPLETE ===\n');
  
  // Give Jest global access to test data
  global.__TEST_DATABASE_SETUP__ = true;
};
