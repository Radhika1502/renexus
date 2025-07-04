// Test setup file for Jest
import 'reflect-metadata';

// Global test configuration
jest.setTimeout(10000);
 
// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db'; 