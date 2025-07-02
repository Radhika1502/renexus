/**
 * Test Setup File for Renexus Testing Suite
 * Phase 5 Implementation - Comprehensive Testing
 */

// Add Jest extended matchers
import '@testing-library/jest-dom';

// Setup for React Testing Library
import { configure } from '@testing-library/react';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  // Wait longer for async operations to complete
  asyncUtilTimeout: 5000,
});

// Global mocks setup
global.fetch = jest.fn();
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock ResizeObserver which isn't available in the test environment
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Clean up mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Console error override to make certain warnings fail tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Fail test if there are prop type warnings or other critical errors
  const message = args.join(' ');
  if (message.includes('Warning: Failed prop type') || 
      message.includes('Warning: React.createElement:')) {
    throw new Error(message);
  }
  originalConsoleError(...args);
};
