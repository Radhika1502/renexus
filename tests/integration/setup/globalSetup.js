/**
 * Global Setup for Integration Tests
 * Phase 5.1.2 - Integration Testing
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const { pool } = require('../../../src/config/database');

module.exports = async function() {
  // Start MongoDB Memory Server for integration tests
  const mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'renexus-test-db',
    }
  });
  
  // Save the connection URI to be used in tests
  process.env.MONGO_URI = mongoServer.getUri();
  global.__MONGO_URI__ = mongoServer.getUri();
  global.__MONGO_SERVER__ = mongoServer;

  // Initialize SQL test database (using connection pool from app)
  try {
    console.log('Setting up test database...');
    
    // Clear any existing test data to start fresh
    await pool.query('DROP SCHEMA IF EXISTS test_schema CASCADE');
    await pool.query('CREATE SCHEMA test_schema');
    
    // Set search path for the test
    await pool.query('SET search_path TO test_schema');
    
    // Import the schema (assumes schema is defined in SQL files)
    const fs = require('fs');
    const path = require('path');
    const schemaSQL = fs.readFileSync(path.resolve(__dirname, '../../../src/database/schema.sql'), 'utf8');
    
    await pool.query(schemaSQL);
    
    // Add seed data for tests
    const seedSQL = fs.readFileSync(path.resolve(__dirname, '../fixtures/seed-data.sql'), 'utf8');
    await pool.query(seedSQL);
    
    console.log('Test database setup completed successfully');
  } catch (error) {
    console.error('Failed to set up test database:', error);
    throw error;
  }

  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
  process.env.PORT = '9000';

  console.log('Integration test environment setup completed');
};
