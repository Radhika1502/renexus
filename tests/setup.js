// Jest setup file
jest.setTimeout(30000); // Set timeout to 30 seconds

// Load environment variables from .env.test
require('dotenv').config({ path: '.env.test' });

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';
process.env.API_VERSION = 'v1';
process.env.CORS_ORIGIN = '*';
process.env.LOG_LEVEL = 'error';
process.env.DB_TYPE = 'test'; // Use test database type

// Mock database for testing
jest.mock('../packages/database/db', () => {
  const mockDb = {
    execute: jest.fn().mockImplementation((query, params) => {
      // Default mock implementation for database queries
      if (query.includes('SELECT') && query.includes('users')) {
        return { rows: [{ id: 'test-user-id', email: 'test@example.com' }] };
      }
      if (query.includes('SELECT') && query.includes('projects')) {
        return { rows: [{ id: 'test-project-id', name: 'Test Project' }] };
      }
      if (query.includes('INSERT')) {
        return { rows: [{ id: 'new-record-id' }] };
      }
      return { rows: [] };
    }),
    transaction: jest.fn().mockImplementation(async (callback) => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] })
      };
      return await callback(mockClient);
    }),
    close: jest.fn().mockResolvedValue(undefined),
    getClient: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn()
    })
  };
  
  return { db: mockDb, pool: { end: jest.fn() } };
});

