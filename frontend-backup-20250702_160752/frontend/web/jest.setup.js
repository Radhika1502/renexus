// Import jest-dom for DOM testing utilities
require('@testing-library/jest-dom');

// Mock window.matchMedia which is not implemented in JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver which is not implemented in JSDOM
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Set timezone for consistent date handling in tests
process.env.TZ = 'UTC';

// Suppress React 18 console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out specific React errors that are not relevant for tests
  if (args[0] && args[0].includes && (
    args[0].includes('Warning: ReactDOM.render') ||
    args[0].includes('Warning: React.createElement')
  )) {
    return;
  }
  originalConsoleError(...args);
};